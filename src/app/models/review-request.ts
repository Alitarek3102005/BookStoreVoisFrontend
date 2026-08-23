export interface ReviewRequest {
  userId: string;
  rating: number;
  comment?: string;
}