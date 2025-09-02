import { Configuration, SchedulerMode, LinkType } from '../types';
import { Logger } from '../utils/logger';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

import config from '../utils/envConfig';

export class ConfigurationManager {
  private logger = new Logger('ConfigurationManager');
  private config: Configuration | null = null;
  private syncRetries = 0;
  private readonly maxSyncRetries = config.AGENT_CONFIG_SYNC_MAX_RETRIES;
  private readonly configFilePath = path.join(__dirname, '../../config/local-config.json');
  private syncInterval?: NodeJS.Timeout;

  constructor(
    private readonly sparkManagerUrl: string,
    private readonly onConfigUpdate: (config: Configuration) => void
  ) {}

  async initialize(): Promise<void> {
    // Try to load local config first
    this.loadLocalConfig();
    
    // Then sync with SparkManager
    await this.syncConfiguration();
    
    // Start periodic sync
    this.startPeriodicSync();
  }

  private loadLocalConfig(): void {
    try {
      if (fs.existsSync(this.configFilePath)) {
        const data = fs.readFileSync(this.configFilePath, 'utf8');
        this.config = JSON.parse(data);
        this.logger.info('Local configuration loaded');
      }
    } catch (error) {
      this.logger.error('Failed to load local configuration', error as Error);
    }
  }

  private saveLocalConfig(): void {
    try {
      const configDir = path.dirname(this.configFilePath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      
      fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2));
      this.logger.info('Configuration saved locally');
    } catch (error) {
      this.logger.error('Failed to save local configuration', error as Error);
    }
  }

  async syncConfiguration(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.sparkManagerUrl}/api/configuration`, {
        timeout: 10000
      });

      if (response.status === 200) {
        this.config = response.data;
        this.saveLocalConfig();
        this.onConfigUpdate(response.data);
        this.syncRetries = 0;
        this.logger.info('Configuration synchronized');
        return true;
      }
    } catch (error) {
      this.syncRetries++;
      this.logger.error('Failed to sync configuration', error as Error, { 
        retries: this.syncRetries 
      });

      if (this.syncRetries >= this.maxSyncRetries) {
        this.logger.warn('Max sync retries reached, entering slow mode');
        this.enterSlowMode();
      }
    }

    return false;
  }

  private enterSlowMode(): void {
    if (this.config) {
      this.config.schedulerMode = SchedulerMode.INTERVAL;
      this.config.intervalMs = config.AGENT_CONFIG_SLOW_MODE_INTERVAL; // 30 seconds
      this.onConfigUpdate(this.config);
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(async () => {
      await this.syncConfiguration();
    }, config.AGENT_CONFIG_SYNC_INTERVAL); // Sync every minute
  }

  getConfiguration(): Configuration | null {
    return this.config;
  }

  stop(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }
  }
}