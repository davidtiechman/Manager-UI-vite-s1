import { SparkAgent } from './agent/sparkAgent';
import { SparkManager } from './manager/sparkManager';
import { SparkProxy } from './proxy/sparkProxy';
import { Logger } from './utils/logger';
import config from './utils/envConfig';
import { log } from 'console';

const logger = new Logger('Main');



async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || 'agent';

  logger.info("------");
  logger.info(`AgentId=${config.agentId}, ApiServerPort=${config.api_port}`);
  logger.info("------");

  try {
    switch (mode) {
      case 'agent':
        await startAgent();
        break;
      case 'manager':
        await startManager();
        break;
      case 'proxy':
        await startSparkProxy();
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
  logger.info('Starting Spark Agent');
  
  /*const agent = new SparkAgent(
    3000, // API port
    'http://localhost:8080/api/messages', // Proxy server URL
    'http://localhost:9000' // Spark Manager URL
  );*/

  const agent = new SparkAgent(
    config.api_port,
    config.AGENT_PROXY_URL,
    config.AGENT_MANAGER_URL,
    config.AGENT_LINK_MONITOR_INTERVAL
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
  logger.info('Starting Spark Manager');
  
  const manager = new SparkManager(config.MANAGER_SERVER_PORT);
  await manager.start();
  
  process.on('SIGINT', () => {
    logger.info('Shutting down manager...');
    process.exit(0);
  });
}

async function startSparkProxy() {
  logger.info('Starting Proxy Server');
  
  const proxy = new SparkProxy(config.PROXY_HTTPS_SERVER_PORT, config.PROXY_WS_SERVER_PORT);
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
  
  await startSparkProxy();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await startAgent();
}

if (require.main === module) {
  main();
}

export * from './types';
export * from './agent/sparkAgent';
export * from './manager/sparkManager';
export * from './proxy/sparkProxy';