import jwt from 'jsonwebtoken';
export function createAuthMiddleware(jwtSecret) {
    return function requireAuth(req, res, next) {
        const authHeader = req.header('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid Authorization header',
                },
            });
            return;
        }
        const token = authHeader.slice('Bearer '.length).trim();
        try {
            const payload = jwt.verify(token, jwtSecret);
            req.userId = payload.userId;
            next();
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired token',
                },
            });
        }
    };
}
//# sourceMappingURL=auth.js.map