import { Message, AgentStatus, LinkType, SchedulerMode, Configuration } from '../types';
import { Logger } from '../utils/logger';
import { ApiServer } from '../api/apiServer';
import { Receiver } from '../core/receiver';
import { Cache } from '../core/cache';
import { SchedulerFactory, SchedulerBase } from '../core/scheduler';
import { Sender } from '../core/sender';
import { FlowControl } from '../core/flowControl';
import { ConfigurationManager } from '../core/configurationManager';
import { v4 as uuidv4 } from 'uuid';

export class FlowControlAgent {
  private logger = new Logger('FlowControlAgent');
  private agentId = uuidv4();
  private apiServer: ApiServer;
  private receiver: Receiver;
  private cache: Cache;
  private scheduler: SchedulerBase | null = null;
  private sender: Sender;
  private flowControl: FlowControl;
  private configManager: ConfigurationManager;
  private running = false;

  constructor(
    private readonly apiPort: number,
    private readonly proxyServerUrl: string,
    private readonly flowControlManagerUrl: string
  ) {
    this.cache = new Cache();
    this.receiver = new Receiver(this.handleValidMessage.bind(this));
    this.sender = new Sender(this.proxyServerUrl);
    this.flowControl = new FlowControl(this.sender);
    this.configManager = new ConfigurationManager(
      this.flowControlManagerUrl,
      this.handleConfigUpdate.bind(this)
    );
    
    this.apiServer = new ApiServer(
      this.apiPort,
      this.handleApiMessage.bind(this),
      this.getStatus.bind(this)
    );
  }

  async start(): Promise<void> {
    if (this.running) return;

    this.logger.info('Starting Flow Control Agent', { agentId: this.agentId });
    
    try {
      // Initialize configuration
      await this.configManager.initialize();
      
      // Start API server
      await this.apiServer.start();
      
      // Start monitoring link qualities
      this.startLinkMonitoring();
      
      this.running = true;
      this.logger.info('Flow Control Agent started successfully');
    } catch (error) {
      this.logger.error('Failed to start Flow Control Agent', error as Error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    this.logger.info('Stopping Flow Control Agent');
    
    this.running = false;
    
    if (this.scheduler) {
      this.scheduler.stop();
    }
    
    this.configManager.stop();
    this.stopLinkMonitoring();
    
    this.logger.info('Flow Control Agent stopped');
  }

  private handleApiMessage(message: Message): void {
    this.receiver.receiveMessage(message);
  }

  private handleValidMessage(message: Message): void {
    this.cache.storeMessage(message);
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
    
    // Update flow control
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
    }, 30000); // Update every 30 seconds
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