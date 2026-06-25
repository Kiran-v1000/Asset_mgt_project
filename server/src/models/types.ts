import type { Request } from 'express';

export interface AuthContext {
  userId: string;
  organizationId: string;
  roleId: string;
  email: string;
  name: string;
  permissions: string[];
}

/** Express Request augmented with the authenticated principal. */
export interface AuthedRequest extends Request {
  auth?: AuthContext;
}

export interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: unknown;
}
