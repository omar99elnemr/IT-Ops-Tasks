import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
export declare const AuthSchemas: {
    login: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
    register: z.ZodObject<{
        firstName: z.ZodString;
        lastName: z.ZodString;
        email: z.ZodString;
        password: z.ZodString;
        preferredShift: z.ZodDefault<z.ZodEnum<["morning", "afternoon"]>>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        preferredShift: "morning" | "afternoon";
    }, {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        preferredShift?: "morning" | "afternoon" | undefined;
    }>;
};
export declare const ContactSchemas: {
    create: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        role: z.ZodDefault<z.ZodEnum<["to", "cc", "none"]>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        role: "to" | "cc" | "none";
    }, {
        name: string;
        email: string;
        role?: "to" | "cc" | "none" | undefined;
    }>;
    update: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
        role: z.ZodOptional<z.ZodEnum<["to", "cc", "none"]>>;
    }, "strip", z.ZodTypeAny, {
        name?: string | undefined;
        email?: string | undefined;
        role?: "to" | "cc" | "none" | undefined;
    }, {
        name?: string | undefined;
        email?: string | undefined;
        role?: "to" | "cc" | "none" | undefined;
    }>;
};
export declare const TaskSchemas: {
    create: z.ZodObject<{
        title: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["completed", "in_progress", "handed_over"]>>;
        type: z.ZodDefault<z.ZodEnum<["fixed", "dynamic"]>>;
        time: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "fixed" | "dynamic";
        status: "completed" | "in_progress" | "handed_over";
        title: string;
        time?: string | undefined;
    }, {
        title: string;
        type?: "fixed" | "dynamic" | undefined;
        status?: "completed" | "in_progress" | "handed_over" | undefined;
        time?: string | undefined;
    }>;
    update: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        status: z.ZodOptional<z.ZodEnum<["completed", "in_progress", "handed_over"]>>;
        time: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status?: "completed" | "in_progress" | "handed_over" | undefined;
        title?: string | undefined;
        time?: string | undefined;
    }, {
        status?: "completed" | "in_progress" | "handed_over" | undefined;
        title?: string | undefined;
        time?: string | undefined;
    }>;
};
export declare const SettingsSchemas: {
    update: z.ZodObject<{
        firstName: z.ZodOptional<z.ZodString>;
        lastName: z.ZodOptional<z.ZodString>;
        preferredShift: z.ZodOptional<z.ZodEnum<["morning", "afternoon"]>>;
    }, "strip", z.ZodTypeAny, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        preferredShift?: "morning" | "afternoon" | undefined;
    }, {
        firstName?: string | undefined;
        lastName?: string | undefined;
        preferredShift?: "morning" | "afternoon" | undefined;
    }>;
};
export declare const SignatureSchemas: {
    create: z.ZodObject<{
        content: z.ZodString;
        mediaUrls: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
        isDefault: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        content: string;
        mediaUrls: string[];
        isDefault: boolean;
    }, {
        content: string;
        mediaUrls?: string[] | undefined;
        isDefault?: boolean | undefined;
    }>;
    update: z.ZodObject<{
        content: z.ZodOptional<z.ZodString>;
        mediaUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        isDefault: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        content?: string | undefined;
        mediaUrls?: string[] | undefined;
        isDefault?: boolean | undefined;
    }, {
        content?: string | undefined;
        mediaUrls?: string[] | undefined;
        isDefault?: boolean | undefined;
    }>;
};
/**
 * Validation error response helper
 */
export declare function handleValidationError(error: z.ZodError): {
    code: string;
    message: string;
    details: Record<string, string>;
};
/**
 * Express middleware factory for schema validation
 */
export declare function validateRequest(schema: z.ZodSchema): (req: Request, res: Response, next: NextFunction) => void;
/**
 * Query string parameter validators
 */
export declare const QuerySchemas: {
    pagination: z.ZodObject<{
        page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
        pageSize: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        pageSize: number;
    }, {
        page?: string | undefined;
        pageSize?: string | undefined;
    }>;
    dateFilter: z.ZodObject<{
        startDate: z.ZodOptional<z.ZodString>;
        endDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }, {
        startDate?: string | undefined;
        endDate?: string | undefined;
    }>;
};
//# sourceMappingURL=validation.d.ts.map