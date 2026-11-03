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

// data de POST /api/auth/login. El token va en una cookie httpOnly: no llega al JavaScript.
export interface LoginResult {
  expiresIn: string;
  user: AuthUser;
  profile: Profile | null;
}

// data de GET /api/auth/me
export interface MeResult {
  user: AuthUser;
  profile: Profile | null;
}
