// Autor de un comentario: solo nombre y foto (nunca email)
export interface VariantCommentAuthor {
  _id: string;
  name: string;
  avatarUrl: string | null;
}

// Valoración de un cliente sobre una variante (tipo de entrada de una sesión)
export interface VariantComment {
  _id: string;
  variant: string;
  rating: number;
  text: string;
  author: VariantCommentAuthor | null;
  createdAt: string;
  updatedAt: string;
}

// Media y número de valoraciones
export interface VariantRating {
  media: number | null;
  total: number;
}

// data de GET /api/comments/variant/:variantId
export interface VariantComments {
  valoracion: VariantRating;
  comentarios: VariantComment[];
}

// Datos que se envían al crear o editar una valoración
export interface VariantCommentInput {
  rating: number;
  text: string;
}

// Valoración tal como la lista el dashboard del admin (con concierto, entrada, ciudad y autor)
export interface AdminComment {
  _id: string;
  rating: number;
  text: string;
  createdAt: string;
  autor: string | null;
  entrada: string | null;
  ciudad: string | null;
  concierto: string | null;
}

export interface SentimientoConcierto {
  concertId: string;
  titulo: string;
  total: number;
  media: number;
  positivos: number;
  neutros: number;
  negativos: number;
}
