import { exec } from 'child_process';
import { promisify } from 'util';
import { LinkType } from '../types';
import { Logger } from './logger';

const execAsync = promisify(exec);

export class RouteManager {
  private logger = new Logger('RouteManager');
  private currentRoutes = new Map<string, string>();

  async setRoute(destination: string, gateway: string, linkType: LinkType): Promise<void> {
    try {
      // Windows route command
      const command = `route add ${destination} mask 255.255.255.0 ${gateway}`;
      
      await execAsync(command);
      this.currentRoutes.set(destination, gateway);
      
      this.logger.info('Route added', { destination, gateway, linkType });
    } catch (error) {
      this.logger.error('Failed to add route', error as Error, { destination, gateway });
      throw error;
    }
  }

  async removeRoute(destination: string): Promise<void> {
    try {
      const command = `route delete ${destination}`;
      
      await execAsync(command);
      this.currentRoutes.delete(destination);
      
      this.logger.info('Route removed', { destination });
    } catch (error) {
      this.logger.error('Failed to remove route', error as Error, { destination });
      throw error;
    }
  }

  async setDefaultRoute(gateway: string, linkType: LinkType): Promise<void> {
    try {
      // Set default route
      await execAsync(`route delete 0.0.0.0`);
      await execAsync(`route add 0.0.0.0 mask 0.0.0.0 ${gateway}`);
      
      this.logger.info('Default route set', { gateway, linkType });
    } catch (error) {
      this.logger.error('Failed to set default route', error as Error, { gateway });
      throw error;
    }
  }

  getCurrentRoutes(): Map<string, string> {
    return new Map(this.currentRoutes);
  }
}
