import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { filter, Subscription } from 'rxjs';
import Keycloak from 'keycloak-js';
import { OrderResponse } from '../../../models/order-response';
import { OrderService } from '../../../services/order-service';
import { TruncatePipe } from '../../../pipes/truncate-pipe';
import { OrderStatusPipe } from '../../../pipes/order-status-pipe';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, OrderStatusPipe, TruncatePipe],
  templateUrl: './order-history.html',
  styleUrls: ['./order-history.css']
})
export class OrderHistory implements OnInit, OnDestroy {
  private orderService = inject(OrderService);
  private keycloak = inject(Keycloak);
  private router = inject(Router);

  orders: (OrderResponse & { isExpanded?: boolean })[] = [];
  isLoading = true;
  processingOrderId: string | null = null;
  private routerSub!: Subscription;

  currentPage: number = 0;
  pageSize: number = 3;
  sortBy: string = 'orderDate,desc';
  hasMoreOrders: boolean = true;
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.currentUserId = (this.keycloak?.tokenParsed as any)?.sub || null;
    this.loadOrders(true);

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/order-history')) {
        this.loadOrders(true);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  loadOrders(resetPage: boolean = false): void {
    if (resetPage) {
      this.currentPage = 0;
    }
    this.isLoading = true;

    if (!this.currentUserId) {
      setTimeout(() => {
        this.currentUserId = (this.keycloak?.tokenParsed as any)?.sub || null;
        if (this.currentUserId) {
          this.fetchOrders();
        } else {
          this.isLoading = false;
        }
      }, 500);
      return;
    }

    this.fetchOrders();
  }

  fetchOrders(): void {
    this.orderService.getOrdersByUser(this.currentUserId!, this.currentPage, this.pageSize, this.sortBy).subscribe({
      next: (backendOrders: OrderResponse[]) => {
        this.orders = backendOrders.map((order, index) => ({
          ...order,
          isExpanded: index === 0 
        }));
        
        this.hasMoreOrders = backendOrders.length === this.pageSize;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load order history:', err);
        this.isLoading = false;
      }
    });
  }

  onSortChange(): void {
    this.loadOrders(true);
  }

  nextPage(): void {
    if (this.hasMoreOrders) {
      this.currentPage++;
      this.fetchOrders();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchOrders();
    }
  }

  toggleOrderDetails(order: any): void {
    order.isExpanded = !order.isExpanded;
  }

  simulatePayment(orderId: string): void {
    this.processingOrderId = orderId;

    this.orderService.payOrder(orderId).subscribe({
      next: (updatedOrder) => {
        const index = this.orders.findIndex(o => o.orderId === orderId);
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
        alert(err.error?.message || 'Payment processing failed. Please try again.');
      }
    });
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