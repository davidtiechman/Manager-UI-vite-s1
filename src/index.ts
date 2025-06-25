import { FlowControlAgent } from './agent/flowControlAgent';
import { FlowControlManager } from './manager/flowControlManager';
import { ProxyServer } from './proxy/proxyServer';
import { Logger } from './utils/logger';

const logger = new Logger('Main');

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'agent';

  try {
    switch (mode) {
      case 'agent':
        await startAgent();
        break;
      case 'manager':
        await startManager();
        break;
      case 'proxy':
        await startProxyServer();
        break;
      case 'all':
        await startAll();
        break;
      default:
        console.log('Usage: npm start [agent|manager|proxy|all]');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Failed to start application', error as Error);
    process.exit(1);
  }
}

async function startAgent() {
  logger.info('Starting Flow Control Agent');
  
  const agent = new FlowControlAgent(
    3000, // API port
    'http://localhost:8080/api/messages', // Proxy server URL
    'http://localhost:9000' // Flow Control Manager URL
  );

  await agent.start();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down agent...');
    await agent.stop();
    process.exit(0);
  });
}

async function startManager() {
  logger.info('Starting Flow Control Manager');
  
  const manager = new FlowControlManager(9000);
  await manager.start();
  
  process.on('SIGINT', () => {
    logger.info('Shutting down manager...');
    process.exit(0);
  });
}

async function startProxyServer() {
  logger.info('Starting Proxy Server');
  
  const proxy = new ProxyServer(8080, 8081);
  await proxy.start();
  
  process.on('SIGINT', () => {
    logger.info('Shutting down proxy server...');
    process.exit(0);
  });
}

async function startAll() {
  logger.info('Starting all components');
  
  // Start in order: Manager -> Proxy -> Agent
  await startManager();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await startProxyServer();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await startAgent();
}

if (require.main === module) {
  main();
}

export * from './types';
export * from './agent/flowControlAgent';
export * from './manager/flowControlManager';
export * from './proxy/proxyServer';