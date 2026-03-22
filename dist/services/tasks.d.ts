import { Database } from 'sqlite3';
import { Task } from '../types/index.js';
/**
 * Task service: CRUD operations and status management
 */
export declare class TaskService {
    private db;
    constructor(db: Database);
    /**
     * Get all tasks for a user by type (non-deleted)
     */
    getTasksByUserId(userId: string, type?: 'fixed' | 'dynamic'): Promise<Task[]>;
    /**
     * Get task by ID
     */
    getTaskById(id: string, userId: string): Promise<Task | null>;
    /**
     * Create new task (fixed or dynamic)
     */
    createTask(userId: string, title: string, type: 'fixed' | 'dynamic', status?: string, time?: string): Promise<Task>;
    /**
     * Update task status and/or time
     */
    updateTask(id: string, userId: string, updates: Partial<{
        status: string;
        time: string;
        title: string;
    }>): Promise<Task>;
    /**
     * Soft delete task
     */
    deleteTask(id: string, userId: string): Promise<void>;
    /**
     * Delete all dynamic tasks for a user (reset)
     */
    deleteAllDynamicTasks(userId: string): Promise<number>;
    private parseTaskRow;
}
//# sourceMappingURL=tasks.d.ts.map