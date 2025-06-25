import { LinkType, LinkQuality } from '../types';
import { Logger } from '../utils/logger';
import { CircuitBreaker } from '../utils/circuitBreaker';
import axios from 'axios';
import * as net from 'net';

export abstract class LinkAdapter {
  protected logger = new Logger(`LinkAdapter-${this.linkType}`);
  protected circuitBreaker = new CircuitBreaker();

  constructor(protected readonly linkType: LinkType) {}

  abstract checkAvailability(): Promise<boolean>;
  abstract measureBandwidth(): Promise<number>;
  abstract measureLatency(): Promise<number>;
  abstract transmit(data: any, url: string): Promise<void>;

  async getLinkQuality(): Promise<LinkQuality> {
    const [available, bandwidth, latency] = await Promise.all([
      this.checkAvailability(),
      this.measureBandwidth(),
      this.measureLatency()
    ]);

    return {
      type: this.linkType,
      available,
      bandwidth,
      latency,
      reliability: this.calculateReliability(available, latency),
      timestamp: Date.now()
    };
  }

  private calculateReliability(available: boolean, latency: number): number {
    if (!available) return 0;
    
    // Simple reliability calculation based on latency
    const maxLatency = 1000; // 1 second
    return Math.max(0, (maxLatency - latency) / maxLatency);
  }
}

export class LanAdapter extends LinkAdapter {
  constructor() {
    super(LinkType.LAN);
  }

  async checkAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      
      socket.connect(80, '8.8.8.8', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => resolve(false));
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  async measureBandwidth(): Promise<number> {
    // Simplified bandwidth measurement
    return 100; // Mbps
  }

  async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      await axios.get('http://8.8.8.8', { timeout: 5000 });
      return Date.now() - start;
    } catch {
      return 9999; // High latency on failure
    }
  }

  async transmit(data: any, url: string): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const response = await axios.post(url, data, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
    });
  }
}

export class MobileAdapter extends LinkAdapter {
  constructor() {
    super(LinkType.MOBILE);
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await axios.get('https://www.google.com', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async measureBandwidth(): Promise<number> {
    // Simplified bandwidth measurement for mobile
    return 50; // Mbps
  }

  async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      await axios.get('https://www.google.com', { timeout: 5000 });
      return Date.now() - start;
    } catch {
      return 9999;
    }
  }

  async transmit(data: any, url: string): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const response = await axios.post(url, data, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
    });
  }
}

export class WifiAdapter extends LinkAdapter {
  constructor() {
    super(LinkType.WIFI);
  }

  async checkAvailability(): Promise<boolean> {
    try {
      await axios.get('https://www.google.com', { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }

  async measureBandwidth(): Promise<number> {
    return 75; // Mbps
  }

  async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      await axios.get('https://www.google.com', { timeout: 3000 });
      return Date.now() - start;
    } catch {
      return 9999;
    }
  }

  async transmit(data: any, url: string): Promise<void> {
    await this.circuitBreaker.execute(async () => {
      const response = await axios.post(url, data, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP ${response.status}`);
      }
    });
  }
}