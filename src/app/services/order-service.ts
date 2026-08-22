import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OrderResponse } from '../models/order-response';
import { OrderRequest } from '../models/order-request';
import Keycloak from 'keycloak-js';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private keycloak = inject(Keycloak);
  private apiUrl = `${environment.apiUrl}/orders`; // Base is /api/orders
  private apiUsersUrl = `${environment.apiUrl}/users`; // Base for /api/users

  createOrder(orderRequest: OrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.apiUrl, orderRequest);
  }

  getOrdersByUser(userId: string): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(`${this.apiUsersUrl}/${userId}/orders`);
  }

  getOrderById(orderId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`${this.apiUrl}/${orderId}`);
  }

  getAllOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>(this.apiUrl);
  }

  // ADD THIS PATCH METHOD:
  patch(orderId: string, patchData: any): Observable<OrderResponse> {
    return this.http.patch<OrderResponse>(`${this.apiUrl}/${orderId}`, patchData);
  }
  payOrder(orderId: string): Observable<OrderResponse> {
    const token = this.keycloak.token;
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post<OrderResponse>(`${this.apiUrl}/${orderId}/pay`, {}, { headers });
  }
}