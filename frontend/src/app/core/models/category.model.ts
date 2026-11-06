export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface CategoryPayload {
  name: string;
  description: string;
  isActive: boolean;
}
