// Datos extendidos del usuario (tabla profiles). Relación 1:1 con User.
export interface Profile {
  _id?: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Datos del usuario que el backend añade al listar perfiles (solo administradores)
export interface ProfileOwner {
  _id: string;
  name: string;
  email: string;
  slug: string;
  status: string;
  isActive: boolean;
}

export interface AdminProfile extends Omit<Profile, 'userId'> {
  userId: ProfileOwner;
}

// Solo los campos editables: el backend ignora cualquier otro (userId, isActive...)
export interface ProfilePayload {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
}
