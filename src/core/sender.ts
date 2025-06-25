import { Message, LinkType } from '../types';
import { Logger } from '../utils/logger';
import { LinkAdapter, LanAdapter, MobileAdapter, WifiAdapter } from '../adapters/linkAdapter';

export class Sender {
  private logger = new Logger('Sender');
  private adapters = new Map<LinkType, LinkAdapter>();

  constructor(private readonly proxyServerUrl: string) {
    this.adapters.set(LinkType.LAN, new LanAdapter());
    this.adapters.set(LinkType.MOBILE, new MobileAdapter());
    this.adapters.set(LinkType.WIFI, new WifiAdapter());
  }

  async sendMessage(message: Message, linkType: LinkType): Promise<void> {
    const adapter = this.adapters.get(linkType);
    if (!adapter) {
      throw new Error(`No adapter found for link type: ${linkType}`);
    }

    try {
      this.logger.info('Sending message', { 
        messageId: message.id, 
        linkType, 
        attempt: message.retries + 1 
      });

      await adapter.transmit(message, this.proxyServerUrl);
      
      this.logger.info('Message sent successfully', { 
        messageId: message.id, 
        linkType 
      });
    } catch (error) {
      message.retries++;
      this.logger.error('Failed to send message', error as Error, { 
        messageId: message.id, 
        linkType, 
        retries: message.retries 
      });
      
      if (message.retries < message.maxRetries) {
        throw error; // Will be retried
      } else {
        this.logger.error('Message exceeded max retries', undefined, { 
          messageId: message.id 
        });
      }
    }
  }

  getAvailableLinks(): LinkType[] {
    return Array.from(this.adapters.keys());
  }

  async getLinkQuality(linkType: LinkType) {
    const adapter = this.adapters.get(linkType);
    return adapter ? await adapter.getLinkQuality() : null;
  }
}