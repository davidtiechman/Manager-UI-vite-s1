
import { Message } from '../types';
import { MessagePriority } from '../types';
import { Logger } from '../utils/logger';

import config from '../utils/envConfig';

export class Receiver {
  private logger = new Logger('Receiver');

  constructor(private readonly onValidMessage: (message: Message) => void) {}

  receiveMessage(message: Message): boolean {
    this.logger.info('Processing message', { messageId: message.id });

    if (!this.validateMessage(message)) {
      this.logger.warn('Invalid message received', { messageId: message.id });
      return false;
    }

    this.onValidMessage(message);
    return true;
  }

  private validateMessage(message: Message): boolean {
    if (!message.id || !message.content) {
      return false;
    }

    if (message.content.length > config.AGENT_API_MAX_MESSAGE_LENGTH) {
      return false;
    }

    if (!Object.values(MessagePriority).includes(message.priority)) {
      return false;
    }

    return true;
  }
}