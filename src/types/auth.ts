export type UserRole = 'customer' | 'merchant' | 'administrator';

export interface ShopSummary {
  shop_id: number;
  name: string;
  shop_type: string;
  address: string;
  phone?: string;
  owner_name?: string;
  photo_url?: string | null;
  status: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  role: UserRole;
  registered_date?: string;
  shop?: ShopSummary | null;
}

export interface AuthSessionData {
  user: UserProfile;
  token: string;
  expires_at: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginPayload {
  username: string; // username or email
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
}