import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import path from 'path';

if (process.env.DOCKER_RUNNER !== 'true')
{
  // Load base .env file
  dotenv.config();
  
  const nodeEnv = process.env.NODE_ENV || 'dev';
  
  // Load environment-specific .env file
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${nodeEnv}`)
  });
}

const config = {
  agentId: process.env.AGENT_ID || uuidv4(),
  AGENT_MANAGER_URL: process.env.AGENT_MANAGER_URL || 'http://localhost:8080/api/messages',
  AGENT_PROXY_URL: process.env.AGENT_PROXY_URL || 'http://localhost:9000',
  AGENT_LINK_MONITOR_INTERVAL: parseInt(process.env.AGENT_LINK_MONITOR_INTERVAL || '30000', 10),
  api_port: parseInt(process.env.AGENT_API_PORT || '3000', 10),
  AGENT_API_CLIENT_TOKEN: process.env.AGENT_API_CLIENT_TOKEN || uuidv4(),
  AGENT_API_MAX_MESSAGE_LENGTH: parseInt(process.env.AGENT_API_MAX_MESSAGE_LENGTH || '10000', 10),
  AGENT_API_MAX_MESSAGE_RETRIES: parseInt(process.env.AGENT_API_MAX_MESSAGE_RETRIES || '3', 10),
  AGENT_CONFIG_SYNC_MAX_RETRIES: parseInt(process.env.AGENT_CONFIG_SYNC_MAX_RETRIES || '3', 10),
  AGENT_CONFIG_SYNC_INTERVAL: parseInt(process.env.AGENT_CONFIG_SYNC_INTERVAL || '60000', 10),
  AGENT_CONFIG_SLOW_MODE_INTERVAL: parseInt(process.env.AGENT_CONFIG_SLOW_MODE_INTERVAL || '30000', 10),

  AGENT_SCHEDULER_CONTINUOUS_CHECK_INTERVAL: parseInt(process.env.AGENT_SCHEDULER_CONTINUOUS_CHECK_INTERVAL || '100', 10),
  AGENT_SCHEDULER_INTERVAL_INTERVAL: parseInt(process.env.AGENT_SCHEDULER_INTERVAL_INTERVAL || '5000', 10),
  AGENT_SCHEDULER_INTERVAL_BATCH_SIZE: parseInt(process.env.AGENT_SCHEDULER_INTERVAL_BATCH_SIZE || '10', 10),

  AGENT_LINK_ADAPTER_TESTING_URL: process.env.AGENT_LINK_ADAPTER_TESTING_URL || 'http://localhost:9000',
  AGENT_LINK_ADPATER_TESTING_TIMEOUT: parseInt(process.env.AGENT_LINK_ADPATER_TESTING_TIMEOUT || '5000', 10),
  AGENT_MONITOR_ADAPTER_SPEED_TEST_URL: process.env.AGENT_MONITOR_ADAPTER_SPEED_TEST_URL || 'https://httpbin.org/bytes/1048576',

  AGENT_DISCOVERY_LAN_PORT: parseInt(process.env.AGENT_DISCOVERY_LAN_PORT || '8888', 10),
  AGENT_DISCOVERY_WAN_PORT: parseInt(process.env.AGENT_DISCOVERY_WAN_PORT || '8889', 10),
  AGENT_DISCOVERY_MULTICAST_ADDRESS: process.env.AGENT_DISCOVERY_MULTICAST_ADDRESS || '224.0.0.1',

  MANAGER_SERVER_PORT: parseInt(process.env.MANAGER_SERVER_PORT || '9000', 10),

  PROXY_HTTPS_SERVER_PORT: parseInt(process.env.PROXY_HTTPS_SERVER_PORT || '8080', 10),
  PROXY_WS_SERVER_PORT: parseInt(process.env.PROXY_HTTPS_SERVER_PORT || '8081', 10)
};

export default config;
