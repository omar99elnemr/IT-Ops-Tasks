import { Database } from 'sqlite3';
import type { AuthRequest, AuthResponse } from '../types/index.js';
export interface JwtPayload {
    userId: string;
    email: string;
}
export declare class AuthService {
    private db;
    private jwtSecret;
    constructor(db: Database, jwtSecret: string);
    register(firstName: string, lastName: string, email: string, password: string, preferredShift?: 'morning' | 'afternoon'): Promise<AuthResponse>;
    login(payload: AuthRequest): Promise<AuthResponse>;
    verifyToken(token: string): JwtPayload;
    private signToken;
    private getUserByEmail;
}
//# sourceMappingURL=auth.d.ts.map