import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
import { Book } from '../../../models/book';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../services/cart-service';

interface CategoryCount { name: string; count: number; id?: string; }

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './catalog-component.html',
  styleUrls: ['./catalog-component.css']
})
export class CatalogComponent implements OnInit {
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);

  isLoading: boolean = true;
  viewMode: 'grid' | 'list' = 'grid';
  quickViewBook: Book | null = null;

  filteredBooks: Book[] = [];
  categories: CategoryCount[] = [];
  
  categoryMap: { [id: string]: string } = {};
  categoryIdMap: { [name: string]: string } = {}; // Maps name back to UUID for backend search

  // Filters & Pagination State
  searchQuery: string = '';
  selectedCategory: string = 'All';
  maxPrice: number = 150;
  inStockOnly: boolean = false;
  sortBy: string = 'recommended';

  currentPage: number = 0;
  pageSize: number = 8;
  totalPages: number = 0;
  totalElements: number = 0;

  skeletonArray = Array(6).fill(0);

  ngOnInit(): void {
    this.loadCatalogData();
  }

  loadCatalogData(): void {
    this.isLoading = true;

    this.categoryService.getAllCategories().subscribe({
      next: (backendCategories: any[]) => {
        backendCategories.forEach(cat => {
          const catId = cat.id || cat.categoryId;
          this.categoryMap[catId] = cat.name;
          this.categoryIdMap[cat.name] = catId;
        });

        // Load category options for the sidebar
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

    this.bookService.searchBooks(
      this.searchQuery || undefined,
      undefined,
      catId,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (books: Book[]) => {
        // Apply client-side filters for price range and stock
        let results = books.filter(book => {
          const matchPrice = book.price <= this.maxPrice;
          const matchStock = this.inStockOnly ? book.quantity > 0 : true;
          return matchPrice && matchStock;
        });

        // Sorting Logic
        if (this.sortBy === 'price-asc') results.sort((a, b) => a.price - b.price);
        if (this.sortBy === 'price-desc') results.sort((a, b) => b.price - a.price);

        this.filteredBooks = results;
        this.totalElements = books.length;
        this.totalPages = Math.ceil(books.length / this.pageSize) || 1;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load books:', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0; // Reset page to 0 on new search or filter
    this.fetchBooks();
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
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
    const cartItem = {
      bookId: book.bookId || (book as any).id,
      title: book.title,
      price: book.price,
      quantity: 1,
      imgURL: book.imgURL || ''
    };
    this.cartService.addToCart(cartItem);
  }
  getBookId(book: any): string {
    return book.bookId || book.id;
  }
}