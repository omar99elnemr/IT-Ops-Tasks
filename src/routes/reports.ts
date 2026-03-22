import { Router, Request, Response, NextFunction } from 'express';
import { Database } from 'sqlite3';
import { ReportService } from '../services/reports.js';
import type { ApiResponse } from '../types/index.js';

export function createReportRoutes(db: Database): Router {
  const router = Router();
  const reportService = new ReportService(db);

  // Mock user extraction from request
  const getUserId = (req: Request): string => {
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    return userId;
  };

  /**
   * POST /api/reports/generate - Generate handover report
   *
   * Request body:
   * {
   *   "userName": "Gerges Hani",
   *   "shift": "morning" | "afternoon",
   *   "signature": "Optional HTML signature"
   * }
   *
   * Returns:
   * {
   *   "subject": "IT Operations Handover - ...",
   *   "recipients": ["email@example.com"],
   *   "cc": ["cc@example.com"],
   *   "htmlBody": "...",
   *   "textBody": "..."
   * }
   */
  router.post(
    '/generate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = getUserId(req);
        const { userName, shift, signature } = req.body;

        // Validate required fields
        if (!userName || !shift) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'userName and shift are required',
            },
          } satisfies ApiResponse<any>);
        }

        if (!['morning', 'afternoon'].includes(shift)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'shift must be "morning" or "afternoon"',
            },
          } satisfies ApiResponse<any>);
        }

        const payload = await reportService.generateReportPayload(
          userId,
          userName,
          shift,
          signature
        );

        res.json({
          success: true,
          data: payload,
        } satisfies ApiResponse<any>);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/reports/preview - Get report preview as HTML (for browser display)
   *
   * Query parameters:
   * ?userName=...&shift=morning|afternoon&signature=...
   */
  router.get('/preview', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = getUserId(req);
      const userName = (req.query.userName as string) || 'User';
      const shift = (req.query.shift as string) || 'morning';
      const signature = (req.query.signature as string) || '';

      if (!['morning', 'afternoon'].includes(shift)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'shift must be "morning" or "afternoon"',
          },
        } satisfies ApiResponse<any>);
      }

      const payload = await reportService.generateReportPayload(
        userId,
        userName,
        shift as 'morning' | 'afternoon',
        signature
      );

      // Return HTML directly (set Content-Type to text/html)
      res.type('text/html').send(payload.htmlBody);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
