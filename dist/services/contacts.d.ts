import { Database } from 'sqlite3';
import { Contact } from '../types/index.js';
/**
 * Contact service: CRUD operations and queries
 */
export declare class ContactService {
    private db;
    constructor(db: Database);
    /**
     * Get all contacts for a user (non-deleted)
     */
    getContactsByUserId(userId: string): Promise<Contact[]>;
    /**
     * Get contact by ID
     */
    getContactById(id: string, userId: string): Promise<Contact | null>;
    /**
     * Create new contact
     */
    createContact(userId: string, name: string, email: string, role: 'to' | 'cc' | 'none'): Promise<Contact>;
    /**
     * Update contact
     */
    updateContact(id: string, userId: string, updates: Partial<{
        name: string;
        email: string;
        role: string;
    }>): Promise<Contact>;
    /**
     * Soft delete contact
     */
    deleteContact(id: string, userId: string): Promise<void>;
}
//# sourceMappingURL=contacts.d.ts.map