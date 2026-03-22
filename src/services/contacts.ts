import { Database } from 'sqlite3';
import { Contact } from '../types/index.js';
import { randomUUID } from 'crypto';

/**
 * Contact service: CRUD operations and queries
 */

export class ContactService {
  constructor(private db: Database) {}

  /**
   * Get all contacts for a user (non-deleted)
   */
  async getContactsByUserId(userId: string): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, userId, name, email, role, createdAt, updatedAt, deletedAt 
         FROM contacts 
         WHERE userId = ? AND deletedAt IS NULL 
         ORDER BY createdAt ASC`,
        [userId],
        (err, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });
  }

  /**
   * Get contact by ID
   */
  async getContactById(id: string, userId: string): Promise<Contact | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT * FROM contacts WHERE id = ? AND userId = ? AND deletedAt IS NULL`,
        [id, userId],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row || null);
        }
      );
    });
  }

  /**
   * Create new contact
   */
  async createContact(
    userId: string,
    name: string,
    email: string,
    role: 'to' | 'cc' | 'none'
  ): Promise<Contact> {
    const id = randomUUID();
    const now = new Date().toISOString();

    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO contacts (id, userId, name, email, role, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, name, email, role, now, now],
        function (err) {
          if (err) reject(err);
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
        }
      );
    });
  }

  /**
   * Update contact
   */
  async updateContact(
    id: string,
    userId: string,
    updates: Partial<{ name: string; email: string; role: string }>
  ): Promise<Contact> {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

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
        if (!c) throw new Error('Contact not found');
        return c;
      });
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);
    values.push(userId);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE contacts SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
        values,
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.getContactById(id, userId)
              .then((c) => {
                if (!c) reject(new Error('Contact not found after update'));
                else resolve(c!);
              })
              .catch(reject);
          }
        }
      );
    });
  }

  /**
   * Soft delete contact
   */
  async deleteContact(id: string, userId: string): Promise<void> {
    const now = new Date().toISOString();
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE contacts SET deletedAt = ? WHERE id = ? AND userId = ?`,
        [now, id, userId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}
