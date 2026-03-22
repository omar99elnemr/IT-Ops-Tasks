import { randomUUID } from 'crypto';
/**
 * Audit service: Log all mutations for compliance and troubleshooting
 */
export class AuditService {
    constructor(db) {
        this.db = db;
    }
    /**
     * Log an audit event
     */
    async logEvent(userId, entityType, entityId, action, changes, ipAddress, userAgent) {
        const id = randomUUID();
        const now = new Date().toISOString();
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO audit_events (id, userId, entityType, entityId, action, changes, ipAddress, userAgent, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, userId, entityType, entityId, action, JSON.stringify(changes), ipAddress || null, userAgent || null, now], function (err) {
                if (err) {
                    reject(err);
                }
                else {
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
            });
        });
    }
    /**
     * Get audit events for a user (filtered by entityType or action)
     */
    async getAuditEvents(userId, filters) {
        let query = 'SELECT * FROM audit_events WHERE userId = ?';
        const params = [userId];
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
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
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
    async getAuditEventCount(userId, filters) {
        let query = 'SELECT COUNT(*) as count FROM audit_events WHERE userId = ?';
        const params = [userId];
        if (filters?.entityType) {
            query += ' AND entityType = ?';
            params.push(filters.entityType);
        }
        if (filters?.action) {
            query += ' AND action = ?';
            params.push(filters.action);
        }
        return new Promise((resolve, reject) => {
            this.db.get(query, params, (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row?.count || 0);
            });
        });
    }
}
//# sourceMappingURL=audit.js.map