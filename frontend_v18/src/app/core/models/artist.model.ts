export const SOCIAL_PLATFORMS = ['instagram', 'spotify', 'youtube', 'x', 'web'] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface ArtistSocial {
  platform: SocialPlatform;
  url: string;
}

export interface Artist {
  _id: string;
  name: string;
  slug: string;
  bio: string;
  socials: ArtistSocial[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface ArtistPayload {
  name: string;
  bio: string;
  socials: ArtistSocial[];
  isActive: boolean;
}
