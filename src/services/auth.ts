import { Database } from 'sqlite3';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { AuthRequest, AuthResponse } from '../types/index.js';

interface UserRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  preferredShift: 'morning' | 'afternoon';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export class AuthService {
  constructor(private db: Database, private jwtSecret: string) {}

  async register(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    preferredShift: 'morning' | 'afternoon' = 'morning'
  ): Promise<AuthResponse> {
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

    await new Promise<void>((resolve, reject) => {
      this.db.run(
        `INSERT INTO users (id, firstName, lastName, email, passwordHash, preferredShift, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, firstName, lastName, email.toLowerCase(), passwordHash, preferredShift, now, now],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
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

  async login(payload: AuthRequest): Promise<AuthResponse> {
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

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.jwtSecret) as JwtPayload;
  }

  private signToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '12h' });
  }

  private async getUserByEmail(email: string): Promise<UserRow | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT id, firstName, lastName, email, passwordHash, preferredShift, createdAt, updatedAt, deletedAt
         FROM users
         WHERE email = ?
         LIMIT 1`,
        [email.toLowerCase()],
        (err, row: UserRow | undefined) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }
}
