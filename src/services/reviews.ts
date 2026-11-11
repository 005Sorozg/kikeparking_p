import type { ImageSourcePropType } from "react-native";
import { apiRequest } from "./api";

interface ReviewApi {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: {
    name: string;
    avatarUrl: string | null;
  };
}

export interface Review {
  id: number;
  stars: number;
  comment: string | null;
  date: Date;
  author: {
    name: string;
    photo?: ImageSourcePropType;
  };
}

const toReview = (r: ReviewApi): Review => ({
  id: r.id,
  stars: r.rating,
  comment: r.comment,
  date: new Date(r.createdAt),
  author: {
    name: r.author.name,
    photo: r.author.avatarUrl ? { uri: r.author.avatarUrl } : undefined,
  },
});

// POST /bookings/:id/review: calificar una reserva completada.
// El conductor califica el parqueadero; el propietario, al conductor (lo decide el backend).
export async function rateBooking(
  bookingId: number,
  stars: number,
  comment: string,
  token: string,
): Promise<Review> {
  const result = await apiRequest<ReviewApi>(`/bookings/${bookingId}/review`, {
    method: "POST",
    token,
    body: { rating: stars, comment: comment.trim() || undefined },
  });

  return toReview(result);
}

// GET /parking-spots/:id/reviews: lo que dijeron los conductores de un parqueadero.
export async function getReviews(parkingSpotId: string): Promise<Review[]> {
  const data = await apiRequest<ReviewApi[]>(`/parking-spots/${parkingSpotId}/reviews`);

  return data.map(toReview);
}

export interface MyRating {
  // Promedio con un decimal (0 si todavía no tiene reseñas)
  average: number;
  reviewCount: number;
}

// GET /users/me/rating: conductor = lo que le dan los propietarios;
// propietario = el promedio de las reseñas de todos sus parqueaderos.
export async function getMyRating(token: string): Promise<MyRating> {
  const result = await apiRequest<{ rating: number; reviewCount: number }>("/users/me/rating", {
    token,
  });

  return { average: result.rating, reviewCount: result.reviewCount };
}

const MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// "nov. de 2026"
export const formatReviewMonth = (date: Date) =>
  `${MONTHS[date.getMonth()]}. de ${date.getFullYear()}`;