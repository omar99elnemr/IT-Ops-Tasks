import { Database } from 'sqlite3';
import { Task } from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * Task service: CRUD operations and status management
 */

export class TaskService {
  constructor(private db: Database) {}

  /**
   * Get all tasks for a user by type (non-deleted)
   */
  async getTasksByUserId(
    userId: string,
    type?: 'fixed' | 'dynamic'
  ): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT id, userId, title, status, type, time, completedAt, createdAt, updatedAt, deletedAt
        FROM tasks
        WHERE userId = ? AND deletedAt IS NULL
        ${type ? 'AND type = ?' : ''}
        ORDER BY createdAt ASC
      `;
      const params = type ? [userId, type] : [userId];

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) reject(err);
        else resolve((rows || []).map(this.parseTaskRow));
      });
    });
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string, userId: string): Promise<Task | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM tasks WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
        [id, userId],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row ? this.parseTaskRow(row) : null);
        }
      );
    });
  }

  /**
   * Create new task (fixed or dynamic)
   */
  async createTask(
    userId: string,
    title: string,
    type: 'fixed' | 'dynamic',
    status: string = 'in_progress',
    time?: string
  ): Promise<Task> {
    const id = randomUUID();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO tasks (id, userId, title, status, type, time, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, title, status, type, time || null, now, now],
        function (err) {
          if (err) reject(err);
          else
            resolve({
              id,
              userId,
              title,
              status: status as any,
              type: type as any,
              time: time || '',
              completedAt: null,
              createdAt: new Date(now),
              updatedAt: new Date(now),
              deletedAt: null,
            });
        }
      );
    });
  }

  /**
   * Update task status and/or time
   */
  async updateTask(
    id: string,
    userId: string,
    updates: Partial<{ status: string; time: string; title: string }>
  ): Promise<Task> {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
      if (updates.status === 'completed') {
        fields.push('completedAt = ?');
        values.push(now);
      }
    }
    if (updates.time !== undefined) {
      fields.push('time = ?');
      values.push(updates.time || null);
    }

    if (fields.length === 0) {
      return this.getTaskById(id, userId).then((t) => {
        if (!t) throw new Error('Task not found');
        return t;
      });
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
        values,
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.getTaskById(id, userId)
              .then((t) => {
                if (!t) reject(new Error('Task not found after update'));
                else resolve(t!);
              })
              .catch(reject);
          }
        }
      );
    });
  }

  /**
   * Soft delete task
   */
  async deleteTask(id: string, userId: string): Promise<void> {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE tasks SET deletedAt = ? WHERE id = ? AND userId = ?`,
        [now, id, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Delete all dynamic tasks for a user (reset)
   */
  async deleteAllDynamicTasks(userId: string): Promise<number> {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE tasks SET deletedAt = ? WHERE userId = ? AND type = 'dynamic' AND deletedAt IS NULL`,
        [now, userId],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes || 0);
        }
      );
    });
  }

  private parseTaskRow(row: any): Task {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      status: row.status as any,
      type: row.type as any,
      time: row.time || '',
      completedAt: row.completedAt ? new Date(row.completedAt) : null,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
    };
  }
}
