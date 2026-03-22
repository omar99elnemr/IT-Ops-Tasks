import { Router } from 'express';
import { TaskService } from '../services/tasks.js';
import { AuditService } from '../services/audit.js';
import { TaskSchemas, validateRequest } from '../middleware/validation.js';
export function createTaskRoutes(db) {
    const router = Router();
    const taskService = new TaskService(db);
    const auditService = new AuditService(db);
    // Mock user extraction from request
    const getUserId = (req) => {
        const userId = req.headers['x-user-id'] || 'default-user';
        return userId;
    };
    const getRequestContext = (req) => ({
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined,
    });
    /**
     * GET /api/tasks - Get all tasks (optionally filtered by type)
     */
    router.get('/', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const type = req.query.type;
            const tasks = await taskService.getTasksByUserId(userId, type);
            res.json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * GET /api/tasks/fixed - Get fixed tasks only
     */
    router.get('/fixed', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const tasks = await taskService.getTasksByUserId(userId, 'fixed');
            res.json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * GET /api/tasks/dynamic - Get dynamic tasks only
     */
    router.get('/dynamic', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const tasks = await taskService.getTasksByUserId(userId, 'dynamic');
            res.json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * GET /api/tasks/:id - Get single task
     */
    router.get('/:id', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const task = await taskService.getTaskById(req.params.id, userId);
            if (!task) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Task not found' },
                });
            }
            res.json({
                success: true,
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * POST /api/tasks - Create new task (fixed or dynamic)
     */
    router.post('/', validateRequest(TaskSchemas.create), async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const { title, status, type, time } = req.body;
            const task = await taskService.createTask(userId, title, type, status, time);
            // Log audit event
            await auditService.logEvent(userId, 'task', task.id, 'create', { title, status, type, time }, ...Object.values(getRequestContext(req)));
            res.status(201).json({
                success: true,
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * PATCH /api/tasks/:id - Update task (status, time, or title)
     */
    router.patch('/:id', validateRequest(TaskSchemas.update), async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const task = await taskService.updateTask(req.params.id, userId, req.body);
            // Log audit event
            await auditService.logEvent(userId, 'task', task.id, 'update', req.body, ...Object.values(getRequestContext(req)));
            res.json({
                success: true,
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * DELETE /api/tasks/:id - Delete task (soft delete)
     */
    router.delete('/:id', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            await taskService.deleteTask(req.params.id, userId);
            // Log audit event
            await auditService.logEvent(userId, 'task', req.params.id, 'delete', {}, ...Object.values(getRequestContext(req)));
            res.json({
                success: true,
                data: { message: 'Task deleted' },
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * POST /api/tasks/reset/dynamic - Delete all dynamic tasks for a user (reset)
     */
    router.post('/reset/dynamic', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const count = await taskService.deleteAllDynamicTasks(userId);
            // Log audit event
            await auditService.logEvent(userId, 'task', 'all-dynamic', 'reset', { deletedCount: count }, ...Object.values(getRequestContext(req)));
            res.json({
                success: true,
                data: { message: `Deleted ${count} dynamic tasks`, deletedCount: count },
            });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=tasks.js.map