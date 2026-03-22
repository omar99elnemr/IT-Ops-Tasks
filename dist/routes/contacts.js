import { Router } from 'express';
import { ContactService } from '../services/contacts.js';
import { AuditService } from '../services/audit.js';
import { ContactSchemas, validateRequest } from '../middleware/validation.js';
export function createContactRoutes(db) {
    const router = Router();
    const contactService = new ContactService(db);
    const auditService = new AuditService(db);
    // Mock user extraction from request (will be replaced with JWT auth in Phase 1d)
    const getUserId = (req) => {
        const userId = req.headers['x-user-id'] || 'default-user';
        return userId;
    };
    const getRequestContext = (req) => ({
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined,
    });
    /**
     * GET /api/contacts - Get all contacts for current user
     */
    router.get('/', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const contacts = await contactService.getContactsByUserId(userId);
            res.json({
                success: true,
                data: contacts,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * GET /api/contacts/:id - Get single contact
     */
    router.get('/:id', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const contact = await contactService.getContactById(req.params.id, userId);
            if (!contact) {
                return res.status(404).json({
                    success: false,
                    error: { code: 'NOT_FOUND', message: 'Contact not found' },
                });
            }
            res.json({
                success: true,
                data: contact,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * POST /api/contacts - Create new contact
     */
    router.post('/', validateRequest(ContactSchemas.create), async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const { name, email, role } = req.body;
            const contact = await contactService.createContact(userId, name, email, role);
            // Log audit event
            await auditService.logEvent(userId, 'contact', contact.id, 'create', { name, email, role }, ...Object.values(getRequestContext(req)));
            res.status(201).json({
                success: true,
                data: contact,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * PATCH /api/contacts/:id - Update contact
     */
    router.patch('/:id', validateRequest(ContactSchemas.update), async (req, res, next) => {
        try {
            const userId = getUserId(req);
            const contact = await contactService.updateContact(req.params.id, userId, req.body);
            // Log audit event
            await auditService.logEvent(userId, 'contact', contact.id, 'update', req.body, ...Object.values(getRequestContext(req)));
            res.json({
                success: true,
                data: contact,
            });
        }
        catch (error) {
            next(error);
        }
    });
    /**
     * DELETE /api/contacts/:id - Delete contact (soft delete)
     */
    router.delete('/:id', async (req, res, next) => {
        try {
            const userId = getUserId(req);
            await contactService.deleteContact(req.params.id, userId);
            // Log audit event
            await auditService.logEvent(userId, 'contact', req.params.id, 'delete', {}, ...Object.values(getRequestContext(req)));
            res.json({
                success: true,
                data: { message: 'Contact deleted' },
            });
        }
        catch (error) {
            next(error);
        }
    });
    return router;
}
//# sourceMappingURL=contacts.js.map