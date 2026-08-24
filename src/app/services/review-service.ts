import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ReviewResponse } from '../models/review-response';
import { ReviewRequest } from '../models/review-request';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl || 'http://localhost:8080/api'}`;

  getReviewsByBook(bookId: string): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.apiUrl}/books/${bookId}/reviews`);
  }

  createReview(bookId: string, request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}/books/${bookId}/reviews`, request);
  }

  patchReview(reviewId: string, patchData: { rating?: number; comment?: string }): Observable<ReviewResponse> {
    return this.http.patch<ReviewResponse>(`${this.apiUrl}/reviews/${reviewId}`, patchData);
  }

  deleteReview(reviewId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/reviews/${reviewId}`);
  }
}