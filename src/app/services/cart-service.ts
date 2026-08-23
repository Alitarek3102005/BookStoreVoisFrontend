import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { CartResponse } from '../models/cart-response';
import { CartItemRequest } from '../models/cart-item-request';
import { CartItemPatchRequest } from '../models/cart-item-patch-request';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api';

  private cartSubject = new BehaviorSubject<CartResponse | null>(null);
  cart$ = this.cartSubject.asObservable();

  loadCart(userId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>(`${this.apiUrl}/users/${userId}/cart`).pipe(
      tap(cart => this.cartSubject.next(cart))
    );
  }

  addItemToCart(userId: string, request: CartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>(`${this.apiUrl}/users/${userId}/cart/items`, request).pipe(
      tap(updatedCart => this.cartSubject.next(updatedCart))
    );
  }

  updateCartItemQuantity(cartItemId: string, request: CartItemPatchRequest): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`${this.apiUrl}/cart-items/${cartItemId}`, request).pipe(
      tap(updatedCart => this.cartSubject.next(updatedCart))
    );
  }

  removeCartItem(cartItemId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cart-items/${cartItemId}`).pipe(
      tap(() => this.loadCart(userId).subscribe()) // Refresh cart state after deletion
    );
  }

  clearCart(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/cart`).pipe(
      tap(() => {
        const current = this.cartSubject.value;
        if (current) {
          this.cartSubject.next({ ...current, items: [], totalAmount: 0 });
        }
      })
    );
  }
}