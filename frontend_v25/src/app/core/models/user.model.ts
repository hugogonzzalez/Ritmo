// Rol del usuario (solo datos básicos; viene del populate)
export interface UserRole {
  _id: string;
  name: string;
  slug: string;
}

export interface User {
  _id: string;
  slug: string;
  name: string;
  email: string;
  roleId: string;
  role: UserRole | null;
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
  isActive: boolean;
}
