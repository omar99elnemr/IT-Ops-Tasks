import sqlite3 from 'sqlite3';
/**
 * Initialize SQLite database with schema
 * Based on Phase 0 baseline domain model
 */
export declare function initializeDatabase(): Promise<sqlite3.Database>;
export declare function getDatabase(): sqlite3.Database;
export declare function closeDatabase(): void;
//# sourceMappingURL=init.d.ts.map