import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { OrderRequest } from '../../../models/order-request';
import { OrderService } from '../../../services/order-service';
import { CartService } from '../../../services/cart-service';
import { BookService } from '../../../services/book-service'; // Make sure this path is correct
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
  private bookService = inject(BookService); // Injected BookService
  private keycloak = inject(Keycloak);

  cart: CartResponse | null = null;
  cartItems: CartItemResponse[] = [];
  
  // Dictionary to store fetched images by bookId
  bookImages: { [bookId: string]: string } = {};
  
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
      this.loadBookImages(); // Fetch images when cart updates
    });

    // Fetch initial cart state from backend
    this.loadUserCart();
  }

  loadUserCart(): void {
    this.cartService.loadCart(this.currentUserId).subscribe({
      error: (err) => console.error('Failed to load cart from backend', err)
    });
  }

  // Fetches the book details for each item to get the image URL
  loadBookImages(): void {
    this.cartItems.forEach(item => {
      if (!this.bookImages[item.bookId]) {
        this.bookService.getBookById(item.bookId).subscribe({
          next: (book: any) => {
            // Check your exact backend property name (imgUrl, imgURL, imageUrl)
            this.bookImages[item.bookId] = book.imgUrl || book.imgURL || book.imageUrl || 'assets/images/placeholder.png';
          },
          error: () => {
            this.bookImages[item.bookId] = 'assets/images/placeholder.png';
          }
        });
      }
    });
  }

  calculateTotals(): void {
    this.subtotal = this.cartItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    
    this.total = this.subtotal;
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