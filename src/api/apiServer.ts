import express from 'express';
import Joi from 'joi';
import { Message, MessagePriority, AgentStatus } from '../types';
import { Logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const messageSchema = Joi.object({
  content: Joi.string().required().max(10000),
  priority: Joi.number().valid(...Object.values(MessagePriority)).required()
});

export class ApiServer {
  private app = express();
  private logger = new Logger('ApiServer');
  private token: string;

  constructor(
    private readonly port: number,
    private readonly onMessage: (message: Message) => void,
    private readonly getStatus: () => AgentStatus,
    token?: string
  ) {
    this.token = token || this.generateToken();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private generateToken(): string {
    return uuidv4();
  }

  private setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader !== `Bearer ${this.token}`) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      next();
    });
  }

  private setupRoutes() {
    this.app.post('/api/messages', (req, res) => {
      const { error, value } = messageSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const message: Message = {
        id: uuidv4(),
        content: value.content,
        priority: value.priority,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3
      };

      try {
        this.onMessage(message);
        this.logger.info('Message received', { messageId: message.id });
        res.json({ success: true, messageId: message.id });
      } catch (err) {
        this.logger.error('Failed to process message', err as Error);
        res.status(500).json({ error: 'Failed to process message' });
      }
    });

    this.app.get('/api/status', (req, res) => {
      try {
        const status = this.getStatus();
        res.json(status);
      } catch (err) {
        this.logger.error('Failed to get status', err as Error);
        res.status(500).json({ error: 'Failed to get status' });
      }
    });

    this.app.get('/api/token', (req, res) => {
      res.json({ token: this.token });
    });
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.port, () => {
        this.logger.info(`API Server started on port ${this.port}`);
        resolve();
      });
    });
  }
}