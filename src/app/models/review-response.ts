export interface ReviewResponse {
  reviewId: string;
  bookId: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}