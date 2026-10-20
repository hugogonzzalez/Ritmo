export const PERFORMANCE_STATUSES = ['scheduled', 'full', 'cancelled', 'completed'] as const;

export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number];

export interface PerformanceArtist {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  images: string[];
}

export interface Performance {
  _id: string;
  concertId: string;
  slug: string;
  venue: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  price: number;
  bookedParticipants: number;
  status: PerformanceStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  images: string[];
  artistIds: string[];
  artists: PerformanceArtist[];
}

export interface PerformancePayload {
  concertId: string;
  venue: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  capacity: number;
  price: number;
  bookedParticipants: number;
  status: PerformanceStatus;
  isActive: boolean;
  artistIds: string[];
}
