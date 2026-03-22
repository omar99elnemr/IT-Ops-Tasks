import { z } from 'zod';
/**
 * Validation schemas for all API inputs
 */
// Time format: HH:mm (24-hour, Cairo timezone)
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format. Use HH:mm');
export const AuthSchemas = {
    login: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
    register: z.object({
        firstName: z.string().min(1, 'First name required'),
        lastName: z.string().min(1, 'Last name required'),
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        preferredShift: z.enum(['morning', 'afternoon']).default('morning'),
    }),
};
export const ContactSchemas = {
    create: z.object({
        name: z.string().min(1, 'Contact name required').max(100),
        email: z.string().email('Invalid email format'),
        role: z.enum(['to', 'cc', 'none']).default('none'),
    }),
    update: z.object({
        name: z.string().min(1, 'Contact name required').max(100).optional(),
        email: z.string().email('Invalid email format').optional(),
        role: z.enum(['to', 'cc', 'none']).optional(),
    }),
};
export const TaskSchemas = {
    create: z.object({
        title: z.string().min(1, 'Task title required').max(200),
        status: z.enum(['completed', 'in_progress', 'handed_over']).default('in_progress'),
        type: z.enum(['fixed', 'dynamic']).default('dynamic'),
        time: TimeSchema.optional(),
    }),
    update: z.object({
        title: z.string().min(1, 'Task title required').max(200).optional(),
        status: z.enum(['completed', 'in_progress', 'handed_over']).optional(),
        time: TimeSchema.optional(),
    }),
};
export const SettingsSchemas = {
    update: z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        preferredShift: z.enum(['morning', 'afternoon']).optional(),
    }),
};
export const SignatureSchemas = {
    create: z.object({
        content: z.string().min(1, 'Signature content required').max(1000),
        mediaUrls: z.array(z.string().url()).optional().default([]),
        isDefault: z.boolean().optional().default(false),
    }),
    update: z.object({
        content: z.string().min(1).max(1000).optional(),
        mediaUrls: z.array(z.string().url()).optional(),
        isDefault: z.boolean().optional(),
    }),
};
/**
 * Validation error response helper
 */
export function handleValidationError(error) {
    const details = {};
    for (const issue of error.issues) {
        const path = issue.path.join('.');
        details[path] = issue.message;
    }
    return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details,
    };
}
/**
 * Express middleware factory for schema validation
 */
export function validateRequest(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errorResponse = handleValidationError(error);
                res.status(400).json({
                    success: false,
                    error: errorResponse,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: { code: 'VALIDATION_ERROR', message: 'Invalid request' },
                });
            }
        }
    };
}
/**
 * Query string parameter validators
 */
export const QuerySchemas = {
    pagination: z.object({
        page: z.string().regex(/^\d+$/).transform(Number).default('1'),
        pageSize: z.string().regex(/^\d+$/).transform(Number).default('20'),
    }),
    dateFilter: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
    }),
};
//# sourceMappingURL=validation.js.map