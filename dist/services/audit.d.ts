import { Database } from 'sqlite3';
import { AuditEvent } from '../types/index.js';
/**
 * Audit service: Log all mutations for compliance and troubleshooting
 */
export declare class AuditService {
    private db;
    constructor(db: Database);
    /**
     * Log an audit event
     */
    logEvent(userId: string, entityType: 'user' | 'contact' | 'task' | 'session' | 'signature', entityId: string, action: 'create' | 'update' | 'delete' | 'reset', changes: Record<string, unknown>, ipAddress?: string, userAgent?: string): Promise<AuditEvent>;
    /**
     * Get audit events for a user (filtered by entityType or action)
     */
    getAuditEvents(userId: string, filters?: {
        entityType?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditEvent[]>;
    /**
     * Get audit event count for pagination
     */
    getAuditEventCount(userId: string, filters?: {
        entityType?: string;
        action?: string;
    }): Promise<number>;
}
//# sourceMappingURL=audit.d.ts.map