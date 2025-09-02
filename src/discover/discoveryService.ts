import * as dgram from 'dgram';
import { Logger } from '../utils/logger';

import config from '../utils/envConfig';

export interface DiscoveryMessage {
  type: 'discover' | 'announce';
  agentId: string;
  timestamp: number;
  data?: any;
}

export class DiscoveryService {
  private logger = new Logger('DiscoveryService');
  private lanSocket?: dgram.Socket;
  private wanSocket?: dgram.Socket;
  private readonly lanPort = config.AGENT_DISCOVERY_LAN_PORT;
  private readonly wanPort = config.AGENT_DISCOVERY_WAN_PORT;
  private readonly multicastAddress = config.AGENT_DISCOVERY_MULTICAST_ADDRESS;

  constructor(
    private readonly agentId: string,
    private readonly onDiscovery: (message: DiscoveryMessage, remote: dgram.RemoteInfo) => void
  ) {}

  start(): void {
    this.startLanDiscovery();
    this.startWanDiscovery();
  }

  stop(): void {
    if (this.lanSocket) {
      this.lanSocket.close();
      this.lanSocket = undefined;
    }
    
    if (this.wanSocket) {
      this.wanSocket.close();
      this.wanSocket = undefined;
    }
  }

  private startLanDiscovery(): void {
    this.lanSocket = dgram.createSocket('udp4');
    
    this.lanSocket.on('message', (buffer, remote) => {
      try {
        const message: DiscoveryMessage = JSON.parse(buffer.toString());
        this.onDiscovery(message, remote);
      } catch (error) {
        this.logger.error('Failed to parse LAN discovery message', error as Error);
      }
    });

    this.lanSocket.bind(this.lanPort, () => {
      this.lanSocket!.setBroadcast(true);
      this.logger.info('LAN discovery started', { port: this.lanPort });
    });
  }

  private startWanDiscovery(): void {
    this.wanSocket = dgram.createSocket('udp4');
    
    this.wanSocket.on('message', (buffer, remote) => {
      try {
        const message: DiscoveryMessage = JSON.parse(buffer.toString());
        this.onDiscovery(message, remote);
      } catch (error) {
        this.logger.error('Failed to parse WAN discovery message', error as Error);
      }
    });

    this.wanSocket.bind(this.wanPort, () => {
      this.wanSocket!.addMembership(this.multicastAddress);
      this.logger.info('WAN discovery started', { port: this.wanPort, multicast: this.multicastAddress });
    });
  }

  sendLanBroadcast(message: DiscoveryMessage): void {
    if (!this.lanSocket) return;
    
    const buffer = Buffer.from(JSON.stringify(message));
    this.lanSocket.send(buffer, this.lanPort, '255.255.255.255', (error) => {
      if (error) {
        this.logger.error('Failed to send LAN broadcast', error);
      }
    });
  }

  sendWanMulticast(message: DiscoveryMessage): void {
    if (!this.wanSocket) return;
    
    const buffer = Buffer.from(JSON.stringify(message));
    this.wanSocket.send(buffer, this.wanPort, this.multicastAddress, (error) => {
      if (error) {
        this.logger.error('Failed to send WAN multicast', error);
      }
    });
  }

  announcePresence(): void {
    const message: DiscoveryMessage = {
      type: 'announce',
      agentId: this.agentId,
      timestamp: Date.now()
    };

    this.sendLanBroadcast(message);
    this.sendWanMulticast(message);
  }
}