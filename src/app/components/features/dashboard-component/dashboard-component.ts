import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Keycloak from 'keycloak-js'; 
import { UserService } from '../../../services/user-service';
import { BookService } from '../../../services/book-service';
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
  private bookService = inject(BookService);
  private keycloak = inject(Keycloak); 
  private apiUrl = environment.apiUrl || 'http://localhost:8080/api';

  activeTab: 'overview' | 'books' | 'users' | 'orders' | 'categories' = 'overview';
  isLoading = true;

  stats: any[] = [];
  recentOrders: any[] = [];
  allBooks: any[] = [];
  allUsers: any[] = [];
  allOrders: any[] = [];
  allCategories: any[] = [];

  // Low stock alert state
  lowStockBooks: any[] = [];
  stockThreshold: number = 10; // Alert if quantity is less than this

  // Inline edit state for stock
  editingStockId: string | null = null;
  editStockValue: number = 0;

  showAddBookModal = false;
  showAddCategoryModal = false;
  
  newBook = { title: '', author: '', price: 0, quantity: 0, description: '', imgURL: '', categoryId: '' };
  newCategory = { name: '', description: '' };
  categories: any[] = [];

  selectedFile: File | null = null;

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

    // Fallback toggle for loading state
    setTimeout(() => {
      this.isLoading = false;
    }, 800);
  }

  loadTabData(tab: string): void {
    if (tab === 'books') this.fetchBooks();
    if (tab === 'users') this.fetchUsers();
    if (tab === 'orders') this.fetchOrders();
    if (tab === 'categories') this.fetchCategories();
  }

  updateStats(): void {
    const totalRevenue = this.allOrders
      .filter(o => o.status === 'COMPLETED' || o.status === 'SHIPPED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    const activeOrdersCount = this.allOrders
      .filter(o => o.status === 'PENDING' || o.status === 'PROCESSING').length;

    const activeBooksCount = this.allBooks.filter(b => b.active !== false).length;

    this.stats = [
      { title: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, trend: 15.2, icon: 'revenue' },
      { title: 'Active Orders', value: activeOrdersCount, trend: 5.4, icon: 'orders' },
      { title: 'Total Customers', value: this.allUsers.length, trend: 12.1, icon: 'users' },
      { title: 'Active Catalog', value: activeBooksCount, trend: -2.3, icon: 'books' }
    ];
  }
  
  fetchBooks(): void {
    this.http.get<any[]>(`${this.apiUrl}/books?size=1000`).subscribe({
      next: (data) => {
        this.allBooks = data;
        // Identify low stock active books
        this.lowStockBooks = this.allBooks.filter(book => book.active !== false && book.quantity < this.stockThreshold);
        this.updateStats();
      },
      error: (err) => console.error('Failed to load books', err)
    });
  }

  // ---- STOCK EDITING LOGIC ----
  startEditStock(book: any): void {
    this.editingStockId = book.bookId;
    this.editStockValue = book.quantity;
  }

  cancelEditStock(): void {
    this.editingStockId = null;
  }

  saveStock(bookId: string): void {
    if (this.editStockValue < 0) {
      alert('Stock cannot be negative.');
      return;
    }
    
    this.http.patch(`${this.apiUrl}/books/${bookId}`, { quantity: this.editStockValue }).subscribe({
      next: () => {
        this.editingStockId = null;
        this.fetchBooks(); // Refresh to update list and alerts
      },
      error: () => alert('Failed to update stock quantity.')
    });
  }
  // ------------------------------

  fetchUsers(): void {
    this.http.get<any[]>(`${this.apiUrl}/users?size=1000`).subscribe({
      next: (data) => {
        this.allUsers = data;
        this.updateStats();
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  fetchOrders(): void {
    this.http.get<any[]>(`${this.apiUrl}/orders?size=1000&sort=orderDate,desc`).subscribe({
      next: (data) => {
        this.allOrders = data;
        this.recentOrders = data.slice(0, 5);
        this.updateStats();
      },
      error: (err) => console.error('Failed to load orders', err)
    });
  }

  fetchCategories(): void {
    this.http.get<any[]>(`${this.apiUrl}/categories?size=1000`).subscribe({
      next: (data) => {
        this.categories = data;
        this.allCategories = data;
      },
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  openAddBookModal(): void { this.showAddBookModal = true; }
  closeAddBookModal(): void { 
    this.showAddBookModal = false; 
    this.selectedFile = null;
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  submitNewBook(): void {
    if (!this.newBook.categoryId) {
      alert('Please select a valid category.');
      return;
    }

    const bookPayload = {
      title: this.newBook.title,
      author: this.newBook.author,
      price: this.newBook.price,
      quantity: this.newBook.quantity,
      description: this.newBook.description,
      categoryId: this.newBook.categoryId
    };

    this.bookService.createBookWithImage(bookPayload, this.selectedFile).subscribe({
      next: () => {
        alert('Book added and cover uploaded to AWS S3 successfully!');
        this.closeAddBookModal();
        this.fetchBooks();
        this.newBook = { title: '', author: '', price: 0, quantity: 0, description: '', imgURL: '', categoryId: '' };
        this.selectedFile = null;
      },
      error: (err) => {
        console.error('Failed to add book', err);
        alert('Failed to add book. Ensure fields are correct.');
      }
    });
  }

  deleteBook(bookId: string): void {
    if (confirm('Are you sure you want to deactivate this book? It will be hidden from the catalog.')) {
      this.http.delete(`${this.apiUrl}/books/${bookId}`).subscribe({
        next: () => {
          alert('Book deactivated successfully.');
          this.fetchBooks();
        },
        error: (err) => alert('Failed to deactivate book.')
      });
    }
  }

  reactivateBook(bookId: string): void {
    if (confirm('Are you sure you want to reactivate this book?')) {
      this.http.patch(`${this.apiUrl}/books/${bookId}`, { active: true }).subscribe({
        next: () => {
          alert('Book reactivated successfully.');
          this.fetchBooks();
        },
        error: (err) => alert('Failed to reactivate book.')
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
    if (confirm('Are you sure you want to deactivate this category?')) {
      this.http.delete(`${this.apiUrl}/categories/${categoryId}`).subscribe({
        next: () => {
          alert('Category deactivated successfully.');
          this.fetchCategories();
        },
        error: (err) => alert(err.error?.message || 'Cannot deactivate category if active books are still assigned to it.')
      });
    }
  }

  reactivateCategory(categoryId: string): void {
    if (confirm('Are you sure you want to reactivate this category?')) {
      this.http.patch(`${this.apiUrl}/categories/${categoryId}`, { active: true }).subscribe({
        next: () => {
          alert('Category reactivated successfully.');
          this.fetchCategories();
        },
        error: (err) => alert('Failed to reactivate category.')
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