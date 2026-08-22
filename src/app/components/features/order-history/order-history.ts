import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import Keycloak from 'keycloak-js';
import { OrderResponse } from '../../../models/order-response';
import { OrderService } from '../../../services/order-service';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-history.html',
  styleUrls: ['./order-history.css']
})
export class OrderHistory implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private keycloak = inject(Keycloak);
  private router = inject(Router);

  orders: (OrderResponse & { isExpanded?: boolean })[] = [];
  isLoading = true;
  processingOrderId: string | null = null; // Tracks which order is currently simulating payment
  private routerSub!: Subscription;

  ngOnInit(): void {
    this.loadOrders();

    // Re-trigger load orders on router navigation back to this page
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/order-history')) {
        this.loadOrders();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  loadOrders(): void {
    this.isLoading = true;
    const userId = (this.keycloak?.tokenParsed as any)?.sub;

    if (userId) {
      this.fetchOrders(userId);
    } else {
      // Fallback check if tokenParsed is still loading
      setTimeout(() => {
        const retryUserId = (this.keycloak?.tokenParsed as any)?.sub;
        if (retryUserId) {
          this.fetchOrders(retryUserId);
        } else {
          this.isLoading = false;
        }
      }, 300);
    }
  }

  fetchOrders(userId: string): void {
    this.orderService.getOrdersByUser(userId).subscribe({
      next: (backendOrders) => {
        this.orders = backendOrders.map((order, index) => ({
          ...order,
          isExpanded: index === 0
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load order history:', err);
        this.isLoading = false;
      }
    });
  }

  toggleOrderDetails(order: any): void {
    order.isExpanded = !order.isExpanded;
  }

  simulatePayment(orderId: string): void {
    this.processingOrderId = orderId;

    setTimeout(() => {
      this.orderService.payOrder(orderId).subscribe({
        next: (updatedOrder) => {
          const index = this.orders.findIndex(o => (o.orderId || (o as any).id) === orderId);
          if (index !== -1) {
            this.orders[index] = {
              ...updatedOrder,
              isExpanded: this.orders[index].isExpanded
            };
          }
          this.processingOrderId = null;
          alert('Payment successful! Your order has been shipped.');
        },
        error: (err) => {
          console.error('Payment failed', err);
          this.processingOrderId = null;
          alert('Payment processing failed. Please try again.');
        }
      });
    }, 2000);
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-success';
      case 'SHIPPED': return 'status-info';
      case 'PROCESSING': return 'status-warning';
      case 'CANCELED': return 'status-danger';
      case 'PENDING': return 'status-warning';
      default: return 'status-default';
    }
  }
}