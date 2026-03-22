/**
 * Core domain types for IT-Ops Platform
 * Based on Phase 0 baseline (PHASE_0_BASELINE.md)
 */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  preferredShift: 'morning' | 'afternoon';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'to' | 'cc' | 'none';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  status: 'completed' | 'in_progress' | 'handed_over';
  type: 'fixed' | 'dynamic';
  time: string; // HH:mm format, Cairo timezone
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ShiftSession {
  id: string;
  userId: string;
  shiftType: 'morning' | 'afternoon';
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditEvent {
  id: string;
  userId: string;
  entityType: 'user' | 'contact' | 'task' | 'session' | 'signature';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'reset';
  changes: Record<string, unknown>; // JSON of what changed
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface Signature {
  id: string;
  userId: string;
  content: string; // HTML-safe formatted text
  mediaUrls: string[]; // Array of image/media URLs
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface SyncQueueItem {
  id: string;
  userId: string;
  entityType: string;
  action: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  synced: boolean;
  createdAt: Date;
  syncedAt: Date | null;
}

/**
 * API Request/Response types
 */

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    preferredShift: string;
  };
}

export interface ContactPayload {
  name: string;
  email: string;
  role: 'to' | 'cc' | 'none';
}

export interface TaskPayload {
  title: string;
  status: 'completed' | 'in_progress' | 'handed_over';
  type: 'fixed' | 'dynamic';
  time?: string; // HH:mm format
}

export interface ReportPayload {
  subject: string;
  recipients: string[];
  cc: string[];
  htmlBody: string;
  textBody: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
