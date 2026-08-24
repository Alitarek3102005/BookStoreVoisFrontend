import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
import { Book } from '../../../models/book';
import { RouterLink, ActivatedRoute } from '@angular/router'; 
import Keycloak from 'keycloak-js'; 
import { CartService } from '../../../services/cart-service';
import { OrderStatusPipe } from '../../../pipes/order-status-pipe';
import { TruncatePipe } from '../../../pipes/truncate-pipe';

interface CategoryCount { name: string; count: number; id?: string; }

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, OrderStatusPipe, TruncatePipe],
  templateUrl: './catalog-component.html',
  styleUrls: ['./catalog-component.css']
})
export class CatalogComponent implements OnInit {
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private keycloak = inject(Keycloak);
  private route = inject(ActivatedRoute); 

  isLoading: boolean = true;
  viewMode: 'grid' | 'list' = 'grid';
  quickViewBook: Book | null = null;

  filteredBooks: Book[] = [];
  categories: CategoryCount[] = [];
  
  categoryMap: { [id: string]: string } = {};
  categoryIdMap: { [name: string]: string } = {}; 

  searchQuery: string = '';
  selectedCategory: string = 'All';
  maxPrice: number = 150;
  inStockOnly: boolean = false;
  sortBy: string = 'recommended';

  currentPage: number = 0;
  pageSize: number = 10;
  totalPages: number = 0;
  totalElements: number = 0;
  hasMoreBooks: boolean = true;

  skeletonArray = Array(6).fill(0);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchQuery = params['search'];
        this.currentPage = 0;
        
        if (this.categories.length > 0) {
          this.fetchBooks();
        }
      } else if (this.searchQuery) {
        this.searchQuery = '';
        this.currentPage = 0;
        if (this.categories.length > 0) {
          this.fetchBooks();
        }
      }
    });

    this.loadCatalogData();
  }

  loadCatalogData(): void {
    this.isLoading = true;

    this.categoryService.getAllCategories({ active: true }).subscribe({
      next: (backendCategories: any[]) => {
        backendCategories.forEach(cat => {
          const catId = cat.id || cat.categoryId;
          this.categoryMap[catId] = cat.name;
          this.categoryIdMap[cat.name] = catId;
        });

        this.categories = [{ name: 'All', count: 0 }, ...backendCategories.map(c => ({ name: c.name, count: 0, id: c.id || c.categoryId }))];

        this.fetchBooks();
      },
      error: (err) => {
        console.error('Failed to load categories:', err);
        this.isLoading = false;
      }
    });
  }

  fetchBooks(): void {
    this.isLoading = true;
    const catId = this.selectedCategory !== 'All' ? this.categoryIdMap[this.selectedCategory] : undefined;

    let backendSort: string | undefined;
    if (this.sortBy === 'price-asc') backendSort = 'price,asc';
    if (this.sortBy === 'price-desc') backendSort = 'price,desc';

    this.bookService.searchBooks(
      this.searchQuery || undefined,
      undefined,
      catId,
      true, 
      this.currentPage,
      this.pageSize,
      backendSort
    ).subscribe({
      next: (books: Book[]) => {
        
        let results = books.filter(book => {
          const matchPrice = book.price <= this.maxPrice;
          const matchStock = this.inStockOnly ? book.quantity > 0 : true;
          return matchPrice && matchStock;
        });

        this.filteredBooks = results;
        
        this.totalElements = books.length;
        this.hasMoreBooks = books.length === this.pageSize; 
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load books:', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0; 
    this.fetchBooks();
  }

  nextPage(): void {
    if (this.hasMoreBooks) {
      this.currentPage++;
      this.fetchBooks();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.fetchBooks();
    }
  }

  getCategoryName(categoryId: string): string {
    return this.categoryMap[categoryId] || 'General';
  }

  openQuickView(book: Book): void {
    this.quickViewBook = book;
    document.body.style.overflow = 'hidden'; 
  }

  closeQuickView(): void {
    this.quickViewBook = null;
    document.body.style.overflow = 'auto';
  }

  addToCart(book: Book): void {
    const tokenParsed: any = this.keycloak.tokenParsed;
    const userId = tokenParsed?.sub;

    if (!userId) {
      alert('Please log in to add items to your cart.');
      return;
    }

    const bookId = book.bookId || (book as any).id;
    
    this.cartService.addItemToCart(userId, {
      bookId: bookId,
      quantity: 1
    }).subscribe({
      next: () => {
        alert(`${book.title} added to your cart successfully!`);
      },
      error: (err) => {
        console.error('Failed to add item to cart', err);
        alert('Could not add item to cart. Check stock availability.');
      }
    });
  }

  getBookId(book: any): string {
    return book.bookId || book.id;
  }
}