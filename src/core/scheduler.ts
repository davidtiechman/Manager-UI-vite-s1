import { Message, SchedulerMode } from '../types';
import { Logger } from '../utils/logger';
import { Cache } from './cache';

import config from '../utils/envConfig';

export abstract class SchedulerBase {
  protected logger = new Logger('Scheduler');
  protected running = false;

  constructor(
    protected readonly cache: Cache,
    protected readonly onMessage: (message: Message) => void
  ) {}

  abstract start(): void;
  abstract stop(): void;
}

export class ContinuousScheduler extends SchedulerBase {
  private intervalId?: NodeJS.Timeout;

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.logger.info('Starting continuous scheduler');
    
    this.intervalId = setInterval(() => {
      this.processMessages();
    }, config.AGENT_SCHEDULER_CONTINUOUS_CHECK_INTERVAL); // Check every 100ms
  }

  stop(): void {
    if (!this.running) return;
    
    this.running = false;
    this.logger.info('Stopping continuous scheduler');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private processMessages(): void {
    const message = this.cache.getNextMessage();
    if (message) {
      this.onMessage(message);
    }
  }
}

export class IntervalScheduler extends SchedulerBase {
  private intervalId?: NodeJS.Timeout;

  constructor(
    cache: Cache,
    onMessage: (message: Message) => void,
    private readonly intervalMs: number = config.AGENT_SCHEDULER_INTERVAL_INTERVAL
  ) {
    super(cache, onMessage);
  }

  start(): void {
    if (this.running) return;
    
    this.running = true;
    this.logger.info('Starting interval scheduler', { intervalMs: this.intervalMs });
    
    this.intervalId = setInterval(() => {
      this.processBatch();
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.running) return;
    
    this.running = false;
    this.logger.info('Stopping interval scheduler');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private processBatch(): void {
    let processed = 0;
    let message: Message | null;
    
    // Process up to 10 messages per batch
    while (processed < config.AGENT_SCHEDULER_INTERVAL_BATCH_SIZE && (message = this.cache.getNextMessage())) {
      this.onMessage(message);
      processed++;
    }
    
    if (processed > 0) {
      this.logger.info('Processed message batch', { count: processed });
    }
  }
}

export class SchedulerFactory {
  static create(
    mode: SchedulerMode,
    cache: Cache,
    onMessage: (message: Message) => void,
    intervalMs?: number
  ): SchedulerBase {
    switch (mode) {
      case SchedulerMode.CONTINUOUS:
        return new ContinuousScheduler(cache, onMessage);
      case SchedulerMode.INTERVAL:
        return new IntervalScheduler(cache, onMessage, intervalMs);
      default:
        throw new Error(`Unknown scheduler mode: ${mode}`);
    }
  }
}
