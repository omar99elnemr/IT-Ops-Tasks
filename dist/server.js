import express from 'express';
import cors from 'cors';
import { initializeDatabase, getDatabase } from './db/init.js';
const app = express();
const PORT = process.env.PORT || 3000;
// ============================================================================
// MIDDLEWARE
// ============================================================================
// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});
// ============================================================================
// HEALTH & STATUS ENDPOINTS
// ============================================================================
/**
 * Health check endpoint for deployment monitoring
 */
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0-phase1',
            environment: process.env.NODE_ENV || 'development',
        },
    });
});
/**
 * API status endpoint
 */
app.get('/api/status', (req, res) => {
    try {
        getDatabase(); // Check if DB is initialized
        res.status(200).json({
            success: true,
            data: {
                api: 'operational',
                database: 'connected',
                timestamp: new Date().toISOString(),
            },
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Database connection error',
            },
        });
    }
});
// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: `Endpoint ${req.method} ${req.path} not found`,
        },
    });
});
// Global error handler
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(error.status || 500).json({
        success: false,
        error: {
            code: error.code || 'INTERNAL_SERVER_ERROR',
            message: error.message || 'An unexpected error occurred',
        },
    });
});
// ============================================================================
// DATABASE INITIALIZATION & SERVER START
// ============================================================================
initializeDatabase()
    .then(() => {
    console.log('✓ Database initialized successfully');
    app.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║  IT Operations - Phase 1 Backend Server                   ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on port ${PORT}                                ║
║  Database: data/it-ops.db                                 ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(37)} ║
║  Health check: /health                                    ║
║  API status: /api/status                                  ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
})
    .catch((error) => {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
});
export default app;
//# sourceMappingURL=server.js.map