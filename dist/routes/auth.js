import { Router } from 'express';
import { AuthService } from '../services/auth.js';
import { AuthSchemas, validateRequest } from '../middleware/validation.js';
export function createAuthRoutes(db, jwtSecret) {
    const router = Router();
    const authService = new AuthService(db, jwtSecret);
    router.post('/register', validateRequest(AuthSchemas.register), async (req, res, next) => {
        try {
            const { firstName, lastName, email, password, preferredShift } = req.body;
            const authResponse = await authService.register(firstName, lastName, email, password, preferredShift);
            res.status(201).json({
                success: true,
                data: authResponse,
            });
        }
        catch (error) {
            next(error);
        }
    });
    router.post('/login', validateRequest(AuthSchemas.login), async (req, res, next) => {
        try {
            const authResponse = await authService.login(req.body);
            res.json({
                success: true,
                data: authResponse,
            });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=auth.js.map