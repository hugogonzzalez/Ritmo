export const ROLE_NAMES = ['admin', 'customer'] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

// Nombres que se muestran en la interfaz para cada rol
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  customer: 'Cliente'
};

// Permisos que se pueden asignar a un rol (la clave es la que guarda el backend)
export const ROLE_PERMISSIONS = [
  { key: 'concerts:read', label: 'Consultar conciertos' },
  { key: 'concerts:manage', label: 'Gestionar conciertos' },
  { key: 'performances:manage', label: 'Gestionar sesiones' },
  { key: 'variants:manage', label: 'Gestionar entradas (variantes)' },
  { key: 'categories:manage', label: 'Gestionar categorías' },
  { key: 'users:manage', label: 'Gestionar usuarios' },
  { key: 'purchases:create', label: 'Comprar entradas' },
  { key: 'orders:read-own', label: 'Consultar sus pedidos' }
] as const;

export type RolePermission = (typeof ROLE_PERMISSIONS)[number]['key'];

export interface Role {
  _id: string;
  slug: string;
  name: RoleName;
  description: string;
  permissions: RolePermission[];
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RolePayload {
  name: RoleName;
  description: string;
  permissions: RolePermission[];
  isActive: boolean;
}
