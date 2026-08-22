export interface User {
  userId?: string;
  username: string;
  email: string;
  password?: string;
  role?: 'CUSTOMER' | 'ADMIN';
  enabled?: boolean;
  address?: string;
}