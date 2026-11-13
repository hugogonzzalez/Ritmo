// Rol del usuario (solo datos básicos; viene del populate)
export interface UserRole {
  _id: string;
  name: string;
  slug: string;
}

// active: puede usar la app; blocked: bloqueada por un administrador
export type UserStatus = 'active' | 'blocked';

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Activo',
  blocked: 'Bloqueado'
};

export interface User {
  _id: string;
  slug: string;
  name: string;
  email: string;
  roleId: string;
  role: UserRole | null;
  status: UserStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

// La contraseña solo se envía al crear o al cambiarla; el backend nunca la devuelve.
export interface UserPayload {
  name: string;
  email: string;
  password?: string;
  roleId: string;
  status: UserStatus;
  isActive: boolean;
}
