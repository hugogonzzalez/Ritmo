export const VENUE_STATUSES = ['active', 'maintenance', 'closed'] as const;

export type VenueStatus = (typeof VENUE_STATUSES)[number];

export interface VenueImage {
  _id: string;
  url: string;
  alt: string;
}

export interface Venue {
  _id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  images: VenueImage[];
  website: string;
  status: VenueStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface VenuePayload {
  name: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  website: string;
  status: VenueStatus;
  isActive: boolean;
}
