import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { JwtUser } from '../types/domain';

export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}

export function signToken(user: Omit<JwtUser, '_id'>): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn']
  };

  return jwt.sign(
    {
      id: user.id,
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    env.jwtSecret,
    options
  );
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
}

export function auth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = readBearerToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'No token provided. Authorization denied'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtUser;
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
      _id: decoded._id || decoded.id
    };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token. Authorization denied',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function adminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  auth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
      return;
    }

    next();
  });
}
