import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import { env } from '../config/env';

fs.mkdirSync(env.logsDirectory, { recursive: true });

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'grandstay-hotel-api' },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const meta = info.metadata ? ` ${JSON.stringify(info.metadata)}` : '';
      return `${info.timestamp} [${info.level.toUpperCase()}] ${info.message}${meta}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf((info) => `[${info.level}] ${info.message}`)
      )
    }),
    new winston.transports.File({
      filename: path.join(env.logsDirectory, 'combined.log'),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(env.logsDirectory, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: path.join(env.logsDirectory, 'api.log'),
      level: 'info',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 10
    })
  ]
});

export function logError(error: unknown, context: Record<string, unknown> = {}): void {
  if (error instanceof Error) {
    logger.error(error.message, {
      metadata: {
        ...context,
        stack: error.stack
      }
    });
    return;
  }

  logger.error('Unknown error', { metadata: { ...context, error } });
}

