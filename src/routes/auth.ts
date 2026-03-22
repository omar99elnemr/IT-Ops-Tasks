import { Router, Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite3';
import { AuthService } from '../services/auth.js';
import { AuthSchemas, validateRequest } from '../middleware/validation.js';
import type { ApiResponse } from '../types/index.js';

export function createAuthRoutes(db: Database, jwtSecret: string): Router {
  const router = Router();
  const authService = new AuthService(db, jwtSecret);

  router.post(
    '/register',
    validateRequest(AuthSchemas.register),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { firstName, lastName, email, password, preferredShift } = req.body;

        const authResponse = await authService.register(
          firstName,
          lastName,
          email,
          password,
          preferredShift
        );

        res.status(201).json({
          success: true,
          data: authResponse,
        } satisfies ApiResponse<any>);
      } catch (error) {
        next(error);
      }
    }
  );

  router.post(
    '/login',
    validateRequest(AuthSchemas.login),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const authResponse = await authService.login(req.body);

        res.json({
          success: true,
          data: authResponse,
        } satisfies ApiResponse<any>);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
