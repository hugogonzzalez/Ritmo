// Una entrada guardada en la lista de deseos, con los datos de su sesión y su concierto
export interface WishlistItem {
  _id: string;
  variantId: string;
  variantName: string;
  price: number;
  city: string;
  startsAt: string;
  concertId: string;
  concertTitle: string;
  concertSlug: string;
  concertImage: string | null;
  createdAt: string;
}
