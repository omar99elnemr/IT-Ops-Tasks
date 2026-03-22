import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { initializeDatabase } from '../db/init.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.join(__dirname, '../../');
const legacyPath = process.env.LEGACY_FILE || path.join(workspaceRoot, 'data/legacy-state.json');
const migrationEmail = (process.env.MIGRATION_USER_EMAIL || 'migrated.user@example.com').toLowerCase();
const migrationPassword = process.env.MIGRATION_USER_PASSWORD || 'Password123';
function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
function get(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row || null);
        });
    });
}
function normalizeTaskStatus(task) {
    const status = task.status?.toLowerCase();
    if (status === 'completed' || task.done === true)
        return 'completed';
    if (status === 'handover' || status === 'handed_over')
        return 'handed_over';
    return 'in_progress';
}
async function ensureMigrationUser(db, userName) {
    const existing = await get(db, 'SELECT id FROM users WHERE email = ? AND deletedAt IS NULL LIMIT 1', [migrationEmail]);
    if (existing?.id)
        return existing.id;
    const id = randomUUID();
    const now = new Date().toISOString();
    const [firstName, ...rest] = userName.trim().split(' ');
    const lastName = rest.join(' ') || 'User';
    await run(db, `INSERT INTO users (id, firstName, lastName, email, passwordHash, preferredShift, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 'morning', ?, ?)`, [id, firstName || 'Migrated', lastName, migrationEmail, bcrypt.hashSync(migrationPassword, 10), now, now]);
    return id;
}
async function migrate() {
    if (!fs.existsSync(legacyPath)) {
        console.log(`No legacy file found at ${legacyPath}. Skipping migration.`);
        process.exit(0);
    }
    const raw = fs.readFileSync(legacyPath, 'utf-8');
    const legacy = JSON.parse(raw);
    const db = await initializeDatabase();
    const userName = legacy.userName || 'Migrated User';
    const userId = await ensureMigrationUser(db, userName);
    let contactsCount = 0;
    for (const contact of legacy.contacts || []) {
        await run(db, `INSERT INTO contacts (id, userId, name, email, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [
            randomUUID(),
            userId,
            contact.name,
            contact.email.toLowerCase(),
            contact.role || 'none',
        ]);
        contactsCount += 1;
    }
    let fixedCount = 0;
    for (const task of legacy.fixedTasks || []) {
        await run(db, `INSERT INTO tasks (id, userId, title, status, type, time, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'fixed', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [randomUUID(), userId, task.title, normalizeTaskStatus(task), task.time || null]);
        fixedCount += 1;
    }
    let dynamicCount = 0;
    for (const task of legacy.dynamicTasks || []) {
        await run(db, `INSERT INTO tasks (id, userId, title, status, type, time, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'dynamic', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [randomUUID(), userId, task.title, normalizeTaskStatus(task), task.time || null]);
        dynamicCount += 1;
    }
    await run(db, `INSERT INTO audit_events (id, userId, entityType, entityId, action, changes, createdAt)
     VALUES (?, ?, 'user', ?, 'update', ?, CURRENT_TIMESTAMP)`, [
        randomUUID(),
        userId,
        userId,
        JSON.stringify({ migration: true, contactsCount, fixedCount, dynamicCount }),
    ]);
    console.log('Migration complete:');
    console.log(`- User email: ${migrationEmail}`);
    console.log(`- Contacts migrated: ${contactsCount}`);
    console.log(`- Fixed tasks migrated: ${fixedCount}`);
    console.log(`- Dynamic tasks migrated: ${dynamicCount}`);
    console.log(`- Temporary password: ${migrationPassword}`);
    db.close();
}
migrate().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map