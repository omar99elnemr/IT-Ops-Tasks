import { Router } from 'express';
import { ReportService } from '../services/reports.js';
export function createReportRoutes(db) {
    const router = Router();
    const reportService = new ReportService(db);
    // Mock user extraction from request
    const getUserId = (req) => {
        const userId = req.headers['x-user-id'] || 'default-user';
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
    router.post('/generate', async (req, res, next) => {
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
                });
            }
            if (!['morning', 'afternoon'].includes(shift)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'shift must be "morning" or "afternoon"',
                    },
                });
            }
            const payload = await reportService.generateReportPayload(userId, userName, shift, signature);
            res.json({
                success: true,
                data: payload,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * GET /api/reports/preview - Get report preview as HTML (for browser display)
     *
     * Query parameters:
     * ?userName=...&shift=morning|afternoon&signature=...
     */
    router.get('/preview', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const userName = req.query.userName || 'User';
            const shift = req.query.shift || 'morning';
            const signature = req.query.signature || '';
            if (!['morning', 'afternoon'].includes(shift)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'shift must be "morning" or "afternoon"',
                    },
                });
            }
            const payload = await reportService.generateReportPayload(userId, userName, shift, signature);
            // Return HTML directly (set Content-Type to text/html)
            res.type('text/html').send(payload.htmlBody);
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=reports.js.map