import { NextFunction, Request, Response } from 'express';
import { logError } from '../utils/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): void {
  logError(error, {
    method: req.method,
    path: req.originalUrl
  });

  res.status(500).json({
    success: false,
    message: error instanceof Error ? error.message : 'Unexpected server error'
  });
}

