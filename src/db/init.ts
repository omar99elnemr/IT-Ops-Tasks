import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/it-ops.db');

/**
 * Initialize SQLite database with schema
 * Based on Phase 0 baseline domain model
 */
export function initializeDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        db.serialize(() => {
          db.run('PRAGMA foreign_keys = ON');

          // Users table
          db.run(`
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY,
              firstName TEXT NOT NULL,
              lastName TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              passwordHash TEXT NOT NULL,
              preferredShift TEXT CHECK(preferredShift IN ('morning', 'afternoon')) DEFAULT 'morning',
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              deletedAt TIMESTAMP
            )
          `);

          // Contacts table
          db.run(`
            CREATE TABLE IF NOT EXISTS contacts (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              role TEXT CHECK(role IN ('to', 'cc', 'none')) DEFAULT 'none',
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              deletedAt TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Tasks table (fixed and dynamic)
          db.run(`
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              title TEXT NOT NULL,
              status TEXT CHECK(status IN ('completed', 'in_progress', 'handed_over')) DEFAULT 'in_progress',
              type TEXT CHECK(type IN ('fixed', 'dynamic')) DEFAULT 'dynamic',
              time TEXT, -- HH:mm format, Cairo timezone
              completedAt TIMESTAMP,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              deletedAt TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Shift sessions table
          db.run(`
            CREATE TABLE IF NOT EXISTS shift_sessions (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              shiftType TEXT CHECK(shiftType IN ('morning', 'afternoon')) NOT NULL,
              startTime TIMESTAMP NOT NULL,
              endTime TIMESTAMP,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Audit events table
          db.run(`
            CREATE TABLE IF NOT EXISTS audit_events (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              entityType TEXT NOT NULL,
              entityId TEXT NOT NULL,
              action TEXT CHECK(action IN ('create', 'update', 'delete', 'reset')) NOT NULL,
              changes TEXT, -- JSON
              ipAddress TEXT,
              userAgent TEXT,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Signatures table
          db.run(`
            CREATE TABLE IF NOT EXISTS signatures (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              content TEXT NOT NULL, -- HTML-safe formatted text
              mediaUrls TEXT, -- JSON array
              isDefault BOOLEAN DEFAULT 0,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              deletedAt TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Sync queue table (for offline-first Phase 2)
          db.run(`
            CREATE TABLE IF NOT EXISTS sync_queue (
              id TEXT PRIMARY KEY,
              userId TEXT NOT NULL,
              entityType TEXT NOT NULL,
              action TEXT CHECK(action IN ('create', 'update', 'delete')) NOT NULL,
              payload TEXT NOT NULL, -- JSON
              synced BOOLEAN DEFAULT 0,
              createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              syncedAt TIMESTAMP,
              FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
            )
          `);

          // Create indices for common queries
          db.run('CREATE INDEX IF NOT EXISTS idx_contacts_userId ON contacts(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_tasks_userId ON tasks(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_shift_sessions_userId ON shift_sessions(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_audit_events_userId ON audit_events(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_signatures_userId ON signatures(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_userId ON sync_queue(userId)');
          db.run('CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced)', () => {
            // Seed a test user for development/testing
            const userId = 'user123';
            const passwordHash = bcrypt.hashSync('Password123', 10);
            
            db.run(
              `INSERT OR IGNORE INTO users (id, firstName, lastName, email, passwordHash, preferredShift) 
               VALUES (?, ?, ?, ?, ?, ?)`,
              [userId, 'Test', 'User', 'test@example.com', passwordHash, 'morning'],
              (err) => {
                if (err) {
                  reject(err);
                } else {
                  db.run(
                    `UPDATE users SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
                    [passwordHash, userId],
                    (updateErr) => {
                      if (updateErr) {
                        reject(updateErr);
                      } else {
                        resolve(db);
                      }
                    }
                  );
                }
              }
            );
          });
        });
      }
    });
  });
}

