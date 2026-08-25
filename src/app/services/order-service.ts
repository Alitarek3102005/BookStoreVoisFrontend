import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponse } from '../models/order-response';
import { OrderRequest } from '../models/order-request';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/orders`;
  private apiUsersUrl = `${environment.apiUrl}/users`; 

  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, orderRequest);
  }

  getOrdersByUser(userId: string, page: number = 0, size: number = 20, sort?: string): Observable<OrderResponse[]> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<OrderResponse[]>(`${this.apiUsersUrl}/${userId}/orders`, { params });
  }

  getOrderById(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`);
  }

  getAllOrders(page: number = 0, size: number = 20, sort?: string, status?: string, customerId?: string): Observable<OrderResponse[]> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);
    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId);

    return this.http.get<OrderResponse[]>(this.apiUrl, { params });
  }

  patch(orderId: string, patchData: any): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiUrl}/${orderId}`, patchData);
  }

  createCheckoutSession(orderId: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/${orderId}/checkout-session`, {});
  }

  // Confirms payment on return from Stripe Checkout - transitions order PENDING -> SHIPPED
  payOrder(orderId: string): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/pay`, {});
  }
}