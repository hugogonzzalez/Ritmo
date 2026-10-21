import { VenueStatus } from './venue.model';

export const PERFORMANCE_STATUSES = ['scheduled', 'full', 'cancelled', 'completed'] as const;

export type PerformanceStatus = (typeof PERFORMANCE_STATUSES)[number];

export interface PerformanceArtist {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  images: string[];
}

// Sala de la sesión (solo datos básicos; viene del populate)
export interface PerformanceVenue {
  _id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  capacity: number;
  status: VenueStatus;
  isActive: boolean;
}

export interface Performance {
  _id: string;
  concertId: string;
  venueId: string;
  venue: PerformanceVenue | null;
  slug: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
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
  venueId: string;
  city: string;
  startsAt: string;
  endsAt: string | null;
  price: number;
  bookedParticipants: number;
  status: PerformanceStatus;
  isActive: boolean;
}
