/*
 * DTO xác thực — trùng `eco_backend` (TokenPairResponse, AuthUserResponse,
 * AuthMessageResponse). Khi chạy `api:sync` sẽ được Orval sinh lại.
 */
export interface AuthUserResponse {
  /* NestJS eco_fashion: uuid chuỗi (mock: chuỗi số). */
  id: string;
  email: string;
  full_name: string;
  role_code: string;
  status: string;
  avatar_url: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: AuthUserResponse;
}

export interface AuthMessageResponse {
  message: string;
}

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; full_name: string; phone?: string; }
export interface ForgotPasswordRequest { email: string; }
export interface GoogleLoginRequest { idToken: string; }
