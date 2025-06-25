import { Message, MessagePriority } from '../types';
import { Logger } from '../utils/logger';

export class Cache {
  private messages = new Map<MessagePriority, Message[]>();
  private logger = new Logger('Cache');

  constructor() {
    // Initialize priority queues
    Object.values(MessagePriority).forEach(priority => {
      if (typeof priority === 'number') {
        this.messages.set(priority, []);
      }
    });
  }

  storeMessage(message: Message): void {
    const priorityQueue = this.messages.get(message.priority);
    if (priorityQueue) {
      priorityQueue.push(message);
      this.logger.info('Message stored', { 
        messageId: message.id, 
        priority: message.priority,
        queueSize: priorityQueue.length 
      });
    }
  }

  getNextMessage(): Message | null {
    // Get highest priority message first
    const priorities = [MessagePriority.CRITICAL, MessagePriority.HIGH, MessagePriority.MEDIUM, MessagePriority.LOW];
    
    for (const priority of priorities) {
      const queue = this.messages.get(priority);
      if (queue && queue.length > 0) {
        const message = queue.shift()!;
        this.logger.info('Message retrieved', { 
          messageId: message.id, 
          priority: message.priority 
        });
        return message;
      }
    }

    return null;
  }

  getQueueSize(): number {
    let total = 0;
    this.messages.forEach(queue => total += queue.length);
    return total;
  }

  getQueueSizeByPriority(priority: MessagePriority): number {
    return this.messages.get(priority)?.length || 0;
  }
}
