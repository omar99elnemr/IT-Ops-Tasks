import { randomUUID } from 'crypto';
/**
 * Contact service: CRUD operations and queries
 */
export class ContactService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get all contacts for a user (non-deleted)
     */
    async getContactsByUserId(userId) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT id, userId, name, email, role, createdAt, updatedAt, deletedAt 
         FROM contacts 
         WHERE userId = ? AND deletedAt IS NULL 
         ORDER BY createdAt ASC`, [userId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows || []);
            });
        });
    }
    /**
     * Get contact by ID
     */
    async getContactById(id, userId) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT * FROM contacts WHERE id = ? AND userId = ? AND deletedAt IS NULL`, [id, userId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    /**
     * Create new contact
     */
    async createContact(userId, name, email, role) {
        const id = randomUUID();
        const now = new Date().toISOString();
        return new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO contacts (id, userId, name, email, role, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, userId, name, email, role, now, now], function (err) {
                if (err)
                    reject(err);
                else
                    resolve({
                        id,
                        userId,
                        name,
                        email,
                        role,
                        createdAt: new Date(now),
                        updatedAt: new Date(now),
                        deletedAt: null,
                    });
            });
        });
    }
    /**
     * Update contact
     */
    async updateContact(id, userId, updates) {
        const now = new Date().toISOString();
        const fields = [];
        const values = [];
        if (updates.name !== undefined) {
            fields.push('name = ?');
            values.push(updates.name);
        }
        if (updates.email !== undefined) {
            fields.push('email = ?');
            values.push(updates.email);
        }
        if (updates.role !== undefined) {
            fields.push('role = ?');
            values.push(updates.role);
        }
        if (fields.length === 0) {
            return this.getContactById(id, userId).then((c) => {
                if (!c)
                    throw new Error('Contact not found');
                return c;
            });
        }
        fields.push('updatedAt = ?');
        values.push(now);
        values.push(id);
        values.push(userId);
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND userId = ?`, values, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.getContactById(id, userId)
                        .then((c) => {
                        if (!c)
                            reject(new Error('Contact not found after update'));
                        else
                            resolve(c);
                    })
                        .catch(reject);
                }
            });
        });
    }
    /**
     * Soft delete contact
     */
    async deleteContact(id, userId) {
        const now = new Date().toISOString();
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE contacts SET deletedAt = ? WHERE id = ? AND userId = ?`, [now, id, userId], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
//# sourceMappingURL=contacts.js.map