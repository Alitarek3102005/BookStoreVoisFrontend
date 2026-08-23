import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { OrderRequest } from '../../../models/order-request';
import { OrderService } from '../../../services/order-service';
import { CartService } from '../../../services/cart-service';
import { CartResponse } from '../../../models/cart-response';
import { CartItemResponse } from '../../../models/cart-item-response';

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

  cart: CartResponse | null = null;
  cartItems: CartItemResponse[] = [];
  
  subtotal: number = 0;
  tax: number = 0;
  shipping: number = 5.00;
  total: number = 0;

  shippingDetails = { fullName: '', address: '', city: '', zipCode: '' };

  isLoading = false;
  errorMessage = '';

  currentUserId: string = '11111111-1111-1111-1111-111111111111';

  ngOnInit(): void {
    const tokenParsed: any = this.keycloak.tokenParsed;
    if (tokenParsed?.sub) {
      this.currentUserId = tokenParsed.sub;
    }

    // Subscribe to real backend cart stream
    this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.cartItems = cart?.items || [];
      this.calculateTotals();
    });

    // Fetch initial cart state from backend
    this.loadUserCart();
  }

  loadUserCart(): void {
    this.cartService.loadCart(this.currentUserId).subscribe({
      error: (err) => console.error('Failed to load cart from backend', err)
    });
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    this.tax = this.subtotal * 0.08; 
    this.total = this.subtotal + this.tax + this.shipping;
  }

  increaseQuantity(item: CartItemResponse): void {
    this.cartService.updateCartItemQuantity(item.cartItemId, { quantity: item.quantity + 1 }).subscribe({
      error: (err) => alert(err.error?.message || 'Failed to update quantity.')
    });
  }

  decreaseQuantity(item: CartItemResponse): void {
    if (item.quantity > 1) {
      this.cartService.updateCartItemQuantity(item.cartItemId, { quantity: item.quantity - 1 }).subscribe({
        error: (err) => alert(err.error?.message || 'Failed to update quantity.')
      });
    }
  }

  removeItem(cartItemId: string): void {
    this.cartService.removeCartItem(cartItemId, this.currentUserId).subscribe({
      error: (err) => console.error('Failed to remove cart item', err)
    });
  }

  onSubmit(): void {
    if (!this.shippingDetails.address || !this.shippingDetails.fullName || !this.shippingDetails.city) {
      this.errorMessage = 'Please fill out all required shipping fields.';
      return;
    }

    if (this.cartItems.length === 0) {
      this.errorMessage = 'Your cart is empty.';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    // Use checkout endpoint or create order mapping backend requirements
    const orderRequest: OrderRequest = {
      userId: this.currentUserId,
      items: this.cartItems.map(item => ({
        bookId: item.bookId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))
    };

    this.orderService.createOrder(orderRequest).subscribe({
      next: () => {
        this.isLoading = false;
        // Clear cart on backend and navigate
        this.cartService.clearCart(this.currentUserId).subscribe(() => {
          this.router.navigate(['/order-history']);
        });
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