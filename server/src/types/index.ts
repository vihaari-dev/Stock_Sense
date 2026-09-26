// Standard API error shape — { error: { code, message, details } }
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

// JWT payload attached to req.user by requireAuth middleware
export interface JwtPayload {
  sub: number;       // user.id
  loginId: string;
  role: 'inventory_manager' | 'warehouse_staff';
  iat: number;
  exp: number;
}

// Augment Express Request so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
