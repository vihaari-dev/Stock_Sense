export type Role = 'inventory_manager' | 'warehouse_staff';

export interface User {
  id: number;
  login_id: string;
  email: string;
  role: Role;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  data: {
    accessToken: string;
  };
}

export interface UserResponse {
  data: User;
}

export interface MessageResponse {
  data: {
    message: string;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
