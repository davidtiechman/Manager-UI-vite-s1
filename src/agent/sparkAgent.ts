import { Message, AgentStatus, LinkType, SchedulerMode, Configuration } from '../types';
import { Logger } from '../utils/logger';
import { ApiServer } from '../api/apiServer';
import { Receiver } from '../core/receiver';
import { Cache } from '../core/cache';
import { SchedulerFactory, SchedulerBase } from '../core/scheduler';
import { Sender } from '../core/sender';
import { FlowControl } from '../core/flowControl';
import { ConfigurationManager } from '../core/configurationManager';
import { DiscoveryMessage, DiscoveryService } from '../discover/discoveryService';
import { MonitorAdapter } from '../adapters/monitorAdapter';
import { RouteManager } from '../utils/routeManager';
import { v4 as uuidv4 } from 'uuid';
import * as dgram from 'dgram';

export class SparkAgent {
  private logger = new Logger('SparkAgent');
  private agentId = uuidv4();
  // core
  private apiServer: ApiServer;
  private receiver: Receiver;
  private cache: Cache;
  private scheduler: SchedulerBase | null = null;
  private sender: Sender;
  private flowControl: FlowControl;
  private configManager: ConfigurationManager;
  private running = false;

  // mgn
  private discoveryService: DiscoveryService;
  private routeManager: RouteManager;
  private monitorAdapter: MonitorAdapter;

  constructor(
    private readonly apiPort: number,
    private readonly sparkProxyUrl: string,
    private readonly sparkManagerUrl: string,
    private readonly linkMonitorInterval: number
  ) {
    this.cache = new Cache();
    this.receiver = new Receiver(this.handleValidMessage.bind(this));
    this.sender = new Sender(this.sparkProxyUrl);
    this.flowControl = new FlowControl(this.sender);
    this.configManager = new ConfigurationManager(
      this.sparkManagerUrl,
      this.handleConfigUpdate.bind(this)
    );
    
    this.apiServer = new ApiServer(
      this.apiPort,
      this.handleApiMessage.bind(this),
      this.getStatus.bind(this)
    );

    this.discoveryService = new DiscoveryService(
      this.agentId, 
      this.handleOnDiscovery.bind(this)
    );

    this.routeManager = new RouteManager();

    this.monitorAdapter = new MonitorAdapter(
      this.sparkManagerUrl,
      this.agentId
    );
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.logger.info('Starting Spark Agent', { agentId: this.agentId });
    
    try {
      // Initialize configuration
      await this.configManager.initialize();
      
      // Start API server
      await this.apiServer.start();
      
      // Start monitoring link qualities
      this.startLinkMonitoring();
      
      this.running = true;
      this.logger.info('Spark Agent started successfully');
    } catch (error) {
      this.logger.error('Failed to start Spark Agent', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    this.logger.info('Stopping Spark Agent');
    
    this.running = false;
    
    if (this.scheduler) {
      this.scheduler.stop();
    }
    
    this.configManager.stop();
    this.stopLinkMonitoring();
    
    this.logger.info('Spark Agent stopped');
  }

  private handleApiMessage(message: Message): void {
    this.receiver.receiveMessage(message);
  }

  private handleValidMessage(message: Message): void {
    this.cache.storeMessage(message);
  }

  private handleOnDiscovery (message: DiscoveryMessage, remote: dgram.RemoteInfo): void {
    
  }

  private async handleScheduledMessage(message: Message): Promise<void> {
    const selectedLink = this.flowControl.getSelectedLink();
    
    try {
      await this.sender.sendMessage(message, selectedLink);
    } catch (error) {
      this.logger.error('Failed to send message', error as Error, { 
        messageId: message.id 
      });
      
      // Re-queue message if retries are available
      if (message.retries < message.maxRetries) {
        setTimeout(() => {
          this.cache.storeMessage(message);
        }, 5000); // Retry after 5 seconds
      }
    }
  }

  private handleConfigUpdate(config: Configuration): void {
    this.logger.info('Configuration updated', { config });
    
    // Update spark
    this.flowControl.setSchedulerMode(config.schedulerMode);
    this.flowControl.setSelectedLink(config.selectedLink);
    
    // Restart scheduler with new mode
    this.restartScheduler(config);
  }

  private restartScheduler(config: Configuration): void {
    if (this.scheduler) {
      this.scheduler.stop();
    }
    
    this.scheduler = SchedulerFactory.create(
      config.schedulerMode,
      this.cache,
      this.handleScheduledMessage.bind(this),
      config.intervalMs
    );
    
    this.scheduler.start();
  }

  private linkMonitoringInterval?: NodeJS.Timeout;

  private startLinkMonitoring(): void {
    this.linkMonitoringInterval = setInterval(async () => {
      await this.flowControl.updateLinkQualities();
    }, this.linkMonitorInterval); // Update every 30 seconds
  }

  private stopLinkMonitoring(): void {
    if (this.linkMonitoringInterval) {
      clearInterval(this.linkMonitoringInterval);
      this.linkMonitoringInterval = undefined;
    }
  }

  private getStatus(): AgentStatus {
    return {
      id: this.agentId,
      status: this.running ? 'active' : 'inactive',
      selectedLink: this.flowControl.getSelectedLink(),
      schedulerMode: this.flowControl.getSchedulerMode(),
      messagesInQueue: this.cache.getQueueSize(),
      linkQualities: this.flowControl.getLinkQualities(),
      timestamp: Date.now()
    };
  }
}