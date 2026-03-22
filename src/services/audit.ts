import { Database } from 'sqlite3';
import { AuditEvent } from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * Audit service: Log all mutations for compliance and troubleshooting
 */

export class AuditService {
  constructor(private db: Database) {}

  /**
   * Log an audit event
   */
  async logEvent(
    userId: string,
    entityType: 'user' | 'contact' | 'task' | 'session' | 'signature',
    entityId: string,
    action: 'create' | 'update' | 'delete' | 'reset',
    changes: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditEvent> {
    const id = randomUUID();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO audit_events (id, userId, entityType, entityId, action, changes, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, entityType, entityId, action, JSON.stringify(changes), ipAddress || null, userAgent || null, now],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id,
              userId,
              entityType,
              entityId,
              action,
              changes,
              ipAddress: ipAddress || null,
              userAgent: userAgent || null,
              createdAt: new Date(now),
            });
          }
        }
      );
    });
  }

  /**
   * Get audit events for a user (filtered by entityType or action)
   */
  async getAuditEvents(
    userId: string,
    filters?: {
      entityType?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditEvent[]> {
    let query = 'SELECT * FROM audit_events WHERE userId = ?';
    const params: any[] = [userId];

    if (filters?.entityType) {
      query += ' AND entityType = ?';
      params.push(filters.entityType);
    }
    if (filters?.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }
    if (filters?.startDate) {
      query += ' AND createdAt >= ?';
      params.push(filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query += ' AND createdAt <= ?';
      params.push(filters.endDate.toISOString());
    }

    query += ' ORDER BY createdAt DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const events = (rows || []).map((row) => ({
            ...row,
            changes: JSON.parse(row.changes || '{}'),
            createdAt: new Date(row.createdAt),
          }));
          resolve(events);
        }
      });
    });
  }

  /**
   * Get audit event count for pagination
   */
  async getAuditEventCount(
    userId: string,
    filters?: {
      entityType?: string;
      action?: string;
    }
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM audit_events WHERE userId = ?';
    const params: any[] = [userId];

    if (filters?.entityType) {
      query += ' AND entityType = ?';
      params.push(filters.entityType);
    }
    if (filters?.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row: any) => {
        if (err) reject(err);
        else resolve(row?.count || 0);
      });
    });
  }
}
