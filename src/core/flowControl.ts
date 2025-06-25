import { LinkType, LinkQuality, SchedulerMode } from '../types';
import { Logger } from '../utils/logger';
import { Sender } from './sender';

export class FlowControl {
  private logger = new Logger('FlowControl');
  private linkQualities = new Map<LinkType, LinkQuality>();
  private selectedLink: LinkType = LinkType.WIFI;
  private schedulerMode: SchedulerMode = SchedulerMode.CONTINUOUS;

  constructor(private readonly sender: Sender) {}

  async updateLinkQualities(): Promise<void> {
    const links = this.sender.getAvailableLinks();
    
    for (const link of links) {
      try {
        const quality = await this.sender.getLinkQuality(link);
        if (quality) {
          this.linkQualities.set(link, quality);
        }
      } catch (error) {
        this.logger.error(`Failed to get quality for link ${link}`, error as Error);
      }
    }

    this.selectBestLink();
  }

  private selectBestLink(): void {
    let bestLink: LinkType | null = null;
    let bestScore = -1;

    this.linkQualities.forEach((quality, linkType) => {
      if (!quality.available) return;

      // Calculate score based on bandwidth, latency, and reliability
      const score = (quality.bandwidth * 0.4) + 
                   ((1000 - quality.latency) * 0.3) + 
                   (quality.reliability * 100 * 0.3);

      if (score > bestScore) {
        bestScore = score;
        bestLink = linkType;
      }
    });

    if (bestLink && bestLink !== this.selectedLink) {
      this.logger.info('Selected new best link', { 
        oldLink: this.selectedLink, 
        newLink: bestLink, 
        score: bestScore 
      });
      this.selectedLink = bestLink;
    }
  }

  getSelectedLink(): LinkType {
    return this.selectedLink;
  }

  setSelectedLink(link: LinkType): void {
    this.selectedLink = link;
    this.logger.info('Manually selected link', { link });
  }

  getSchedulerMode(): SchedulerMode {
    return this.schedulerMode;
  }

  setSchedulerMode(mode: SchedulerMode): void {
    this.schedulerMode = mode;
    this.logger.info('Scheduler mode changed', { mode });
  }

  getLinkQualities(): LinkQuality[] {
    return Array.from(this.linkQualities.values());
  }
}