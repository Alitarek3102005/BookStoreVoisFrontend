import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { CartService, CartItem } from '../../../services/cart-service';
import { OrderRequest } from '../../../models/order-request';
import { OrderService } from '../../../services/order-service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout implements OnInit {
  private router = inject(Router);
  private cartService = inject(CartService);
  private orderService = inject(OrderService);
  private keycloak = inject(Keycloak);

  cartItems: CartItem[] = [];
  subtotal: number = 0;
  tax: number = 0;
  shipping: number = 5.00;
  total: number = 0;

  shippingDetails = { fullName: '', address: '', city: '', zipCode: '' };

  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.cartService.cart$.subscribe(items => {
      this.cartItems = items;
      this.calculateTotals();
    });
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    this.tax = this.subtotal * 0.08; 
    this.total = this.subtotal + this.tax + this.shipping;
  }

  increaseQuantity(item: CartItem): void {
    this.cartService.updateQuantity(item.bookId, item.quantity + 1);
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.cartService.updateQuantity(item.bookId, item.quantity - 1);
    }
  }

  removeItem(bookId: string): void {
    this.cartService.removeFromCart(bookId);
  }

  onSubmit(): void {
    if (!this.shippingDetails.address || !this.shippingDetails.fullName || !this.shippingDetails.city) {
      this.errorMessage = 'Please fill out all required shipping fields.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    const tokenParsed: any = this.keycloak.tokenParsed;
    const currentUserId = tokenParsed?.sub || 'guest-user-id';

    const orderRequest: OrderRequest = {
      userId: currentUserId,
      items: this.cartItems.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        unitPrice: item.price
      }))
    };

    this.orderService.createOrder(orderRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cartService.clearCart(); 
        this.router.navigate(['/order-history']); 
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Not enough stock available for one or more items.';
        }
      }
    });
  }
}