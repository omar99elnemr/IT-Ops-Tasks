import express, { Request, Response, NextFunction, Express } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import sqlite3 from 'sqlite3';
import { initializeDatabase } from './db/init.js';
import { createAuthMiddleware } from './middleware/auth.js';
import { createAuthRoutes } from './routes/auth.js';
import { createContactRoutes } from './routes/contacts.js';
import { createTaskRoutes } from './routes/tasks.js';
import { createReportRoutes } from './routes/reports.js';
import type { ApiResponse } from './types/index.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicPath = path.join(__dirname, '../public');

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

// Basic security and traceability headers
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  res.setHeader('X-Request-ID', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = res.getHeader('X-Request-ID') || 'unknown';
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use(express.static(publicPath));

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

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'index.html'));
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

// Store db globally for serverless handler access
let globalDb: sqlite3.Database | null = null;

async function startServer() {
  try {
    const db = await initializeDatabase();
    globalDb = db;
    console.log('✓ Database initialized successfully');

    // Inject db middleware
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.db = db;
      next();
    });

    const requireAuth = createAuthMiddleware(JWT_SECRET);

    // Public auth routes
    app.use('/api/auth', createAuthRoutes(db, JWT_SECRET));

    // Register API routes BEFORE error handlers
    app.use('/api/contacts', requireAuth, createContactRoutes(db));
    app.use('/api/tasks', requireAuth, createTaskRoutes(db));
    app.use('/api/reports', requireAuth, createReportRoutes(db));

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

    // Only listen locally (not in serverless/production)
    if (process.env.NODE_ENV !== 'production') {
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
║    - POST /api/auth/register                              ║
║    - POST /api/auth/login                                 ║
║    - POST /api/contacts                                   ║
║    - GET /api/contacts, /api/contacts/:id                 ║
║    - POST /api/tasks                                      ║
║    - GET /api/tasks, /api/tasks/:id                       ║
║    - POST /api/reports/generate                           ║
║    - GET /api/reports/preview                             ║
╚═══════════════════════════════════════════════════════════╝
        `);
      });
    }
  } catch (error) {
    console.error('✗ Failed to initialize database:', error);
    
    // Add fallback route to report the error instead of 404ing
    app.use('/api', (req: Request, res: Response) => {
      res.status(500).json({
        success: false,
        error: {
          code: 'INITIALIZATION_FAILED',
          message: 'Server failed to start database',
          details: error instanceof Error ? error.message : String(error)
        }
      });
    });

    // In serverless, if we don't exit, the instance stays alive but broken.
    // We must exit so Vercel spins up a fresh instance next time.
    process.exit(1);
  }
}

// Export for serverless environments (Vercel, etc.)
export default app;

// Initialize startup (will run database setup and listen locally if not production)
await startServer();
