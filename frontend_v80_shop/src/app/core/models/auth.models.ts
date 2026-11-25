import { Profile } from './profile.model';
import { User } from './user.model';

// Roles que usa la interfaz. El backend guarda el nombre del rol (admin / customer); se traduce a ADMIN / USER.
export type AuthRole = 'ADMIN' | 'USER';

// Usuario tal y como lo devuelve la API (con el rol populado)
export type AuthUser = User;

export interface LoginCredentials {
  email: string;
  password: string;
}

// data de POST /api/auth/login. El token se guarda en AuthStore y el interceptor lo envía en Authorization.
export interface LoginResult {
  expiresIn: string;
  token: string;
  user: AuthUser;
  profile: Profile | null;
}

// data de GET /api/auth/me
export interface MeResult {
  user: AuthUser;
  profile: Profile | null;
}

// Datos para crear una cuenta de cliente (POST /api/auth/register)
export interface RegisterData {
  name: string;
  email: string;
  password: string;
}
