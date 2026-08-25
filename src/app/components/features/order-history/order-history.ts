import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, NavigationEnd } from '@angular/router';
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
  private route = inject(ActivatedRoute);

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

    // Handle return from Stripe Checkout: confirm payment before loading orders
    this.route.queryParams.subscribe(params => {
      if (params['payment'] === 'success' && params['orderId']) {
        this.confirmStripePayment(params['orderId']);
      } else {
        this.loadOrders(true);
      }
    });

    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      if (event.url.includes('/order-history') && !event.url.includes('payment=success')) {
        this.loadOrders(true);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private confirmStripePayment(orderId: string): void {
    this.isLoading = true;
    this.orderService.payOrder(orderId).subscribe({
      next: () => {
        // Strip the query params so a page refresh doesn't retrigger payment confirmation
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        this.loadOrders(true);
      },
      error: (err) => {
        console.error('Failed to confirm payment for order', orderId, err);
        // Order may already be marked paid (e.g. webhook beat us to it) - just reload
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        this.loadOrders(true);
      }
    });
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

  // --- CANCEL ORDER ---
  cancelOrder(orderId: string): void {
    if (confirm('Are you sure you want to cancel this order?')) {
      this.processingOrderId = orderId;

      this.orderService.patch(orderId, { status: 'CANCELED' }).subscribe({
        next: () => {
          this.processingOrderId = null;
          // Refresh the current page to reflect the new CANCELED status
          this.loadOrders(); 
        },
        error: (err) => {
          console.error('Failed to cancel order', err);
          this.processingOrderId = null;
          alert(err.error?.message || 'Could not cancel the order. Please try again.');
        }
      });
    }
  }

  // --- STRIPE PAYMENT REDIRECTION ---
  payWithStripe(orderId: string): void {
    this.processingOrderId = orderId;

    this.orderService.createCheckoutSession(orderId).subscribe({
      next: (response) => {
        // Redirect browser to Stripe Hosted Checkout page
        window.location.href = response.url;
      },
      error: (err) => {
        console.error('Failed to create Stripe checkout session', err);
        this.processingOrderId = null;
        alert(err.error?.message || 'Could not initiate Stripe payment. Please try again.');
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