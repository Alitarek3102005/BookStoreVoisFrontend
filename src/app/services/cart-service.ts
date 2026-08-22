import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
  imgURL: string;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private cartKey = 'bookstore_cart';
  
  private cartSubject = new BehaviorSubject<CartItem[]>([]);
  cart$ = this.cartSubject.asObservable();

  constructor() {
    this.loadCart();
  }

  // Gets the current list synchronously (fixes the error in your screenshot!)
  getItems(): CartItem[] {
    return this.cartSubject.value;
  }

  addToCart(item: CartItem): void {
    const currentCart = this.cartSubject.value;
    const existingItem = currentCart.find(i => i.bookId === item.bookId);

    if (existingItem) {
      existingItem.quantity += item.quantity;

    } else {
      currentCart.push(item);
    }
    this.updateCart(currentCart);
  }

  updateQuantity(bookId: string, quantity: number): void {
    const currentCart = this.cartSubject.value;
    const item = currentCart.find(i => i.bookId === bookId);
    
    if (item) {
      item.quantity = quantity;
      this.updateCart(currentCart);
    }
  }

  removeFromCart(bookId: string): void {
    const currentCart = this.cartSubject.value.filter(i => i.bookId !== bookId);
    this.updateCart(currentCart);
  }

  clearCart(): void {
    this.updateCart([]);
  }

  private updateCart(newCart: CartItem[]): void {
    this.cartSubject.next(newCart);
    localStorage.setItem(this.cartKey, JSON.stringify(newCart));
  }

  private loadCart(): void {
    const savedCart = localStorage.getItem(this.cartKey);
    if (savedCart) {
      try {
        this.cartSubject.next(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart', error);
        this.updateCart([]);
      }
    }
  }
}