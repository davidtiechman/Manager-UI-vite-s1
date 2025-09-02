import express from 'express';
import { WebSocket, WebSocketServer } from 'ws';
import { Message } from '../types';
import { Logger } from '../utils/logger';

export class SparkProxy {
  private app = express();
  private wss: WebSocketServer;
  private logger = new Logger('SparkProxy');
  private connectedClients = new Set<WebSocket>();

  constructor(
    private readonly httpPort: number,
    private readonly wsPort: number
  ) {
    this.wss = new WebSocketServer({ port: this.wsPort });
    this.setupHttpServer();
    this.setupWebSocketServer();
  }

  private setupHttpServer(): void {
    this.app.use(express.json());

    // Receive messages from agents
    this.app.post('/api/messages', (req, res) => {
      const message: Message = req.body;
      
      this.logger.info('Message received from agent', { 
        messageId: message.id,
        priority: message.priority 
      });

      // Forward to all connected clients
      this.broadcastMessage(message);
      
      res.json({ success: true });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: Date.now(),
        connectedClients: this.connectedClients.size 
      });
    });
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws) => {
      this.connectedClients.add(ws);
      this.logger.info('Client connected', { totalClients: this.connectedClients.size });

      ws.on('close', () => {
        this.connectedClients.delete(ws);
        this.logger.info('Client disconnected', { totalClients: this.connectedClients.size });
      });

      ws.on('error', (error) => {
        this.logger.error('WebSocket error', error);
        this.connectedClients.delete(ws);
      });
    });
  }

  private broadcastMessage(message: Message): void {
    const messageStr = JSON.stringify(message);
    
    for (const client of this.connectedClients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          this.logger.error('Failed to send message to client', error as Error);
          this.connectedClients.delete(client);
        }
      }
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.httpPort, () => {
        this.logger.info(`SparkProxy HTTP started on port ${this.httpPort}`);
        this.logger.info(`SparkProxy WebSocket started on port ${this.wsPort}`);
        resolve();
      });
    });
  }
}
