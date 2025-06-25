import winston from 'winston';
import path from 'path';

export class Logger {
  private logger: winston.Logger;

  constructor(component: string) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { component },
      transports: [
        new winston.transports.File({ 
          filename: path.join('logs', `${component}-error.log`), 
          level: 'error' 
        }),
        new winston.transports.File({ 
          filename: path.join('logs', `${component}.log`) 
        }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    });
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.message, stack: error?.stack, ...meta });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }
}