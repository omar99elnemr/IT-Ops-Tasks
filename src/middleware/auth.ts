import { Request, Response, NextFunction } from 'express';
import type { JwtPayload } from '../services/auth.js';
import type { ApiResponse } from '../types/index.js';
import jwt from 'jsonwebtoken';

export function createAuthMiddleware(jwtSecret: string) {
  return function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.header('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid Authorization header',
        },
      } satisfies ApiResponse<any>);
      return;
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      req.userId = payload.userId;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token',
        },
      } satisfies ApiResponse<any>);
    }
  };
}
