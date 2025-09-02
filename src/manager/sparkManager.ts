import express from 'express';
import { AgentStatus, Configuration, LinkType, SchedulerMode } from '../types';
import { Logger } from '../utils/logger';

import config from '../utils/envConfig';

export interface RegisteredAgent {
  id: string;
  lastSeen: number;
  status: AgentStatus;
  configuration: Configuration;
}

export class SparkManager {
  private app = express();
  private logger = new Logger('SparkManager');
  private agents = new Map<string, RegisteredAgent>();
  private defaultConfiguration: Configuration = {
    schedulerMode: SchedulerMode.INTERVAL,
    selectedLink: LinkType.MOBILE,
    intervalMs: config.AGENT_SCHEDULER_INTERVAL_INTERVAL,
    maxRetries: config.AGENT_API_MAX_MESSAGE_RETRIES,
    sparkProxyUrl: config.AGENT_PROXY_URL,
    token: config.AGENT_API_CLIENT_TOKEN
  };

  constructor(private readonly port: number) {
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      this.logger.info('Request received', { 
        method: req.method, 
        path: req.path,
        ip: req.ip 
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Get configuration for agents
    this.app.get('/api/configuration', (req, res) => {
      res.json(this.defaultConfiguration);
    });

    // Update configuration
    this.app.post('/api/configuration', (req, res) => {
      this.defaultConfiguration = { ...this.defaultConfiguration, ...req.body };
      this.logger.info('Configuration updated', { config: this.defaultConfiguration });
      res.json({ success: true });
    });

    // Receive monitoring data from agents
    this.app.post('/api/monitoring', (req, res) => {
      const { agentId, timestamp, linkQualities, systemMetrics } = req.body;
      
      if (this.agents.has(agentId)) {
        const agent = this.agents.get(agentId)!;
        agent.lastSeen = timestamp;
        agent.status.linkQualities = linkQualities;
        
        this.logger.info('Monitoring data received', { agentId, linkQualities: linkQualities.length });
      }
      
      res.json({ success: true });
    });

    // Register agent
    this.app.post('/api/agents/register', (req, res) => {
      const { agentId, status } = req.body;
      
      const agent: RegisteredAgent = {
        id: agentId,
        lastSeen: Date.now(),
        status,
        configuration: this.defaultConfiguration
      };
      
      this.agents.set(agentId, agent);
      this.logger.info('Agent registered', { agentId });
      
      res.json({ success: true, configuration: this.defaultConfiguration });
    });

    // Get all agents
    this.app.get('/api/agents', (req, res) => {
      const agentList = Array.from(this.agents.values());
      res.json(agentList);
    });

    // Get specific agent
    this.app.get('/api/agents/:id', (req, res) => {
      const agent = this.agents.get(req.params.id);
      if (agent) {
        res.json(agent);
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    });

    // Update agent configuration
    this.app.post('/api/agents/:id/configuration', (req, res) => {
      const agent = this.agents.get(req.params.id);
      if (agent) {
        agent.configuration = { ...agent.configuration, ...req.body };
        this.logger.info('Agent configuration updated', { 
          agentId: req.params.id, 
          config: agent.configuration 
        });
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Agent not found' });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        agents: this.agents.size 
      });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info(`SparkManager started on port ${this.port}`);
        this.startAgentCleanup();
        resolve();
      });
    });
  }

  private startAgentCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes
      
      for (const [agentId, agent] of this.agents) {
        if (now - agent.lastSeen > timeout) {
          this.agents.delete(agentId);
          this.logger.info('Agent removed due to timeout', { agentId });
        }
      }
    }, 60000); // Check every minute
  }
}