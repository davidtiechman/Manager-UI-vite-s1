import { LinkType, LinkQuality } from '../types';
import { Logger } from '../utils/logger';
import axios from 'axios';

export interface SpeedTestResult {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
}

export class MonitorAdapter {
  private logger = new Logger('MonitorAdapter');

  constructor(
    private readonly flowControlManagerUrl: string,
    private readonly agentId: string
  ) {}

  async sendMonitoringData(linkQualities: LinkQuality[]): Promise<void> {
    try {
      const monitoringData = {
        agentId: this.agentId,
        timestamp: Date.now(),
        linkQualities,
        systemMetrics: await this.getSystemMetrics()
      };

      await axios.post(`${this.flowControlManagerUrl}/api/monitoring`, monitoringData, {
        timeout: 10000
      });

      this.logger.info('Monitoring data sent successfully');
    } catch (error) {
      this.logger.error('Failed to send monitoring data', error as Error);
    }
  }

  async performSpeedTest(linkType: LinkType): Promise<SpeedTestResult> {
    this.logger.info('Starting speed test', { linkType });
    
    try {
      // Simplified speed test - in production, use proper speed test endpoints
      const testUrl = 'https://httpbin.org/bytes/1048576'; // 1MB test file
      
      const downloadStart = Date.now();
      const response = await axios.get(testUrl, { timeout: 30000 });
      const downloadTime = Date.now() - downloadStart;
      
      const downloadSpeed = (1 * 8) / (downloadTime / 1000); // Mbps
      
      // Simple upload test
      const uploadStart = Date.now();
      await axios.post('https://httpbin.org/post', { data: 'x'.repeat(100000) }, { timeout: 30000 });
      const uploadTime = Date.now() - uploadStart;
      
      const uploadSpeed = (0.1 * 8) / (uploadTime / 1000); // Mbps
      
      const result: SpeedTestResult = {
        downloadSpeed,
        uploadSpeed,
        latency: await this.measureLatency(),
        packetLoss: 0 // Simplified
      };

      this.logger.info('Speed test completed', { linkType, result });
      return result;
    } catch (error) {
      this.logger.error('Speed test failed', error as Error, { linkType });
      throw error;
    }
  }

  private async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      await axios.get('https://www.google.com', { timeout: 5000 });
      return Date.now() - start;
    } catch {
      return 9999;
    }
  }

  private async getSystemMetrics() {
    const process = await import('process');
    return {
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      uptime: process.uptime()
    };
  }
}
