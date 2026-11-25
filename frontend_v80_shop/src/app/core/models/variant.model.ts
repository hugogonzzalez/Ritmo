// Sesión a la que pertenece la variante (solo datos básicos; viene del populate)
export interface VariantPerformance {
  _id: string;
  slug: string;
  city: string;
  startsAt: string;
  status: string;
  isActive: boolean;
}

export interface Variant {
  _id: string;
  slug: string;
  sku: string;
  performanceId: string;
  performance: VariantPerformance | null;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  images: string[];
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface VariantPayload {
  performanceId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  sold: number;
  isActive: boolean;
}
