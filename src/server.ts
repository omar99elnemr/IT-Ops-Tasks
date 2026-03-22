import express, { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/init.js';
import { createContactRoutes } from './routes/contacts.js';
import { createTaskRoutes } from './routes/tasks.js';
import { createReportRoutes } from './routes/reports.js';
import type { ApiResponse } from './types/index.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE (before routes)
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
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ============================================================================
// HEALTH & STATUS (before routes)
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0-phase1',
      environment: process.env.NODE_ENV || 'development',
    },
  } satisfies ApiResponse<any>);
});

app.get('/api/status', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      api: 'operational',
      database: 'connected',
      timestamp: new Date().toISOString(),
    },
  } satisfies ApiResponse<any>);
});

// ============================================================================
// STARTUP
// ============================================================================

async function startServer() {
  try {
    const db = await initializeDatabase();
    console.log('✓ Database initialized successfully');

    // Inject db middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.db = db;
      next();
    });

    // Register API routes BEFORE error handlers
    app.use('/api/contacts', createContactRoutes(db));
    app.use('/api/tasks', createTaskRoutes(db));
    app.use('/api/reports', createReportRoutes(db));

    // ============================================================================
    // ERROR HANDLERS (after routes)
    // ============================================================================

    app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Endpoint ${req.method} ${req.path} not found`,
        },
      } satisfies ApiResponse<any>);
    });

    app.use((error: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(error.status || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_SERVER_ERROR',
          message: error.message || 'An unexpected error occurred',
        },
      } satisfies ApiResponse<any>);
    });

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
║  API routes (Phase 1c):                                   ║
║    - POST /api/contacts                                   ║
║    - GET /api/contacts, /api/contacts/:id                 ║
║    - POST /api/tasks                                      ║
║    - GET /api/tasks, /api/tasks/:id                       ║
║    - POST /api/reports/generate                           ║
║    - GET /api/reports/preview                             ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();

export default app;
