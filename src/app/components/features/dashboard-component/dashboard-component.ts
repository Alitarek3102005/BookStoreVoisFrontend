import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Keycloak from 'keycloak-js'; // <-- Added Keycloak
import { UserService } from '../../../services/user-service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard-component.html',
  styleUrls: ['./dashboard-component.css']
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private keycloak = inject(Keycloak); // <-- Available if you need Admin profile details
  private apiUrl = environment.apiUrl || 'http://localhost:8080/api';

  activeTab: 'overview' | 'books' | 'users' | 'orders' | 'categories' = 'overview';
  isLoading = true;

  stats: any[] = [];
  recentOrders: any[] = [];
  allBooks: any[] = [];
  allUsers: any[] = [];
  allOrders: any[] = [];
  allCategories: any[] = [];

  showAddBookModal = false;
  showAddCategoryModal = false;
  
  newBook = { title: '', author: '', price: 0, quantity: 0, description: '', imgURL: '', categoryId: '' };
  newCategory = { name: '', description: '' };
  categories: any[] = [];

  ngOnInit(): void {
    this.loadAdminData();
  }

  setTab(tab: 'overview' | 'books' | 'users' | 'orders' | 'categories'): void {
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  loadAdminData(): void {
    this.isLoading = true;
    this.fetchOrders();
    this.fetchBooks();
    this.fetchUsers();
    this.fetchCategories();

    setTimeout(() => {
      this.stats = [
        // Real logic could calculate total revenue from COMPLETED orders
        { title: 'Total Revenue', value: '$12,450.00', trend: 15.2, icon: 'revenue' },
        { title: 'Active Orders', value: this.allOrders.length, trend: 5.4, icon: 'orders' },
        { title: 'Total Customers', value: this.allUsers.length, trend: 12.1, icon: 'users' },
        { title: 'Catalog Size', value: this.allBooks.length, trend: -2.3, icon: 'books' }
      ];
      this.isLoading = false;
    }, 600);
  }

  loadTabData(tab: string): void {
    if (tab === 'books') this.fetchBooks();
    if (tab === 'users') this.fetchUsers();
    if (tab === 'orders') this.fetchOrders();
    if (tab === 'categories') this.fetchCategories();
  }

  // NOTE: Auth headers are now automatically attached by auth.interceptor.ts!
  
  fetchBooks(): void {
    this.http.get<any[]>(`${this.apiUrl}/books`).subscribe({
      next: (data) => this.allBooks = data,
      error: (err) => console.error('Failed to load books', err)
    });
  }

  fetchUsers(): void {
    this.http.get<any[]>(`${this.apiUrl}/users`).subscribe({
      next: (data) => this.allUsers = data,
      error: (err) => console.error('Failed to load users', err)
    });
  }

  fetchOrders(): void {
    this.http.get<any[]>(`${this.apiUrl}/orders`).subscribe({
      next: (data) => {
        this.allOrders = data;
        this.recentOrders = data.slice(0, 5);
      },
      error: (err) => console.error('Failed to load orders', err)
    });
  }

  fetchCategories(): void {
    this.http.get<any[]>(`${this.apiUrl}/categories`).subscribe({
      next: (data) => {
        this.categories = data;
        this.allCategories = data;
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  openAddBookModal(): void { this.showAddBookModal = true; }
  closeAddBookModal(): void { this.showAddBookModal = false; }

  submitNewBook(): void {
    if (!this.newBook.categoryId) {
      alert('Please select a valid category.');
      return;
    }

    this.http.post(`${this.apiUrl}/books`, this.newBook).subscribe({
      next: () => {
        alert('Book added successfully!');
        this.closeAddBookModal();
        this.fetchBooks();
        this.newBook = { title: '', author: '', price: 0, quantity: 0, description: '', imgURL: '', categoryId: '' };
      },
      error: (err) => {
        console.error('Failed to add book', err);
        alert('Failed to add book. Ensure fields are correct and image URL is short.');
      }
    });
  }

  deleteBook(bookId: string): void {
    if (confirm('Are you sure you want to delete this book?')) {
      this.http.delete(`${this.apiUrl}/books/${bookId}`).subscribe({
        next: () => this.fetchBooks(),
        error: (err) => alert('Cannot delete book if tied to active records/order history.')
      });
    }
  }

  openAddCategoryModal(): void { this.showAddCategoryModal = true; }
  closeAddCategoryModal(): void { this.showAddCategoryModal = false; }

  submitNewCategory(): void {
    this.http.post(`${this.apiUrl}/categories`, this.newCategory).subscribe({
      next: () => {
        alert('Category added successfully!');
        this.closeAddCategoryModal();
        this.fetchCategories();
        this.newCategory = { name: '', description: '' };
      },
      error: (err) => {
        console.error('Failed to add category', err);
        alert('Failed to add category.');
      }
    });
  }

  deleteCategory(categoryId: string): void {
    if (confirm('Are you sure you want to delete this category?')) {
      this.http.delete(`${this.apiUrl}/categories/${categoryId}`).subscribe({
        next: () => this.fetchCategories(),
        error: (err) => alert(err.error?.message || 'Cannot delete category if books are still assigned to it.')
      });
    }
  }

  updateUserRole(userId: string, newRole: string): void {
    this.userService.patchUser(userId, { role: newRole as any }).subscribe({
      next: () => {
        alert('User role updated successfully.');
        this.fetchUsers();
      },
      error: (err) => alert('Failed to update user role.')
    });
  }

  toggleUserStatus(userId: string, currentStatus: boolean): void {
    const actionText = currentStatus ? 'disable' : 'activate';
    if (confirm(`Are you sure you want to ${actionText} this user?`)) {
      this.userService.patchUser(userId, { enabled: !currentStatus }).subscribe({
        next: () => this.fetchUsers(),
        error: (err) => alert('Failed to update user activation status.')
      });
    }
  }

  updateOrderStatus(orderId: string, newStatus: string): void {
    this.http.patch(`${this.apiUrl}/orders/${orderId}`, { status: newStatus }).subscribe({
      next: () => {
        alert(`Order status updated to ${newStatus}`);
        this.fetchOrders();
      },
      error: (err) => alert('Failed to update order status.')
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'SHIPPED': return 'badge-info';
      case 'PROCESSING': return 'badge-warning';
      case 'PENDING': return 'badge-warning';
      case 'CANCELED': return 'badge-danger';
      default: return 'badge-default';
    }
  }
}