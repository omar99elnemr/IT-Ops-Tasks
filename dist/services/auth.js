import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
export class AuthService {
    db;
    jwtSecret;
    constructor(db, jwtSecret) {
        this.db = db;
        this.jwtSecret = jwtSecret;
    }
    async register(firstName, lastName, email, password, preferredShift = 'morning') {
        const existing = await this.getUserByEmail(email);
        if (existing) {
            throw Object.assign(new Error('Email already registered'), {
                status: 409,
                code: 'EMAIL_EXISTS',
            });
        }
        const id = randomUUID();
        const now = new Date().toISOString();
        const passwordHash = await bcrypt.hash(password, 10);
        await new Promise((resolve, reject) => {
            this.db.run(`INSERT INTO users (id, firstName, lastName, email, passwordHash, preferredShift, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [id, firstName, lastName, email.toLowerCase(), passwordHash, preferredShift, now, now], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        const token = this.signToken({ userId: id, email: email.toLowerCase() });
        return {
            token,
            user: {
                id,
                firstName,
                lastName,
                email: email.toLowerCase(),
                preferredShift,
            },
        };
    }
    async login(payload) {
        const user = await this.getUserByEmail(payload.email);
        if (!user || user.deletedAt) {
            throw Object.assign(new Error('Invalid email or password'), {
                status: 401,
                code: 'INVALID_CREDENTIALS',
            });
        }
        const isValid = await bcrypt.compare(payload.password, user.passwordHash);
        if (!isValid) {
            throw Object.assign(new Error('Invalid email or password'), {
                status: 401,
                code: 'INVALID_CREDENTIALS',
            });
        }
        const token = this.signToken({ userId: user.id, email: user.email });
        return {
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                preferredShift: user.preferredShift,
            },
        };
    }
    verifyToken(token) {
        return jwt.verify(token, this.jwtSecret);
    }
    signToken(payload) {
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '12h' });
    }
    async getUserByEmail(email) {
        return new Promise((resolve, reject) => {
            this.db.get(`SELECT id, firstName, lastName, email, passwordHash, preferredShift, createdAt, updatedAt, deletedAt
         FROM users
         WHERE email = ?
         LIMIT 1`, [email.toLowerCase()], (err, row) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(row || null);
                }
            });
        });
    }
}
//# sourceMappingURL=auth.js.map