import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
import { CartService } from '../../../services/cart-service';
import { VideoService } from '../../../services/video-service';
import { LabService } from '../../../services/lab-service';

interface ContentItem { id: string; title: string; subtitle: string; imgURL: string; }
interface Video extends ContentItem { duration: string; tag: string; }
interface Lab extends ContentItem { tech: string; difficulty: string; }
interface AdvancedBook extends ContentItem { 
  author: string; basePrice: number; quantity: number; 
  rating: number; formats: { type: string; price: number }[]; 
  selectedFormat?: string; badge?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private videoService = inject(VideoService);
  private labService = inject(LabService);
  private keycloak = inject(Keycloak);
  private cdr = inject(ChangeDetectorRef);

  private observer!: IntersectionObserver;

  stats: { label: string; value: string }[] = [];
  
  rawCategories: any[] = [];
  stacks: string[] = ['All'];
  activeStack = 'All';
  
  books: AdvancedBook[] = [];
  videos: Video[] = [];
  labs: Lab[] = [];

  searchQuery: string = '';
  currentPage: number = 0;
  pageSize: number = 6; 
  hasMoreBooks: boolean = true;
  isLoadingBooks: boolean = false;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadVideos();
    this.loadLabs();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe(categories => {
      this.rawCategories = categories;
      this.stacks = ['All', ...categories.map(c => c.name)];
      
      this.loadBooks(true); 
    });
  }

  loadBooks(resetPage: boolean = false): void {
    if (resetPage) {
      this.currentPage = 0;
    }
    this.isLoadingBooks = true;

    let catId = undefined;
    if (this.activeStack !== 'All') {
      const category = this.rawCategories.find(c => c.name === this.activeStack);
      catId = category?.id || category?.categoryId;
    }

    this.bookService.searchBooks(
      this.searchQuery || undefined, 
      undefined, 
      catId, 
      this.currentPage, 
      this.pageSize, 
      'title,ASC'
    ).subscribe({
      next: (backendBooks) => {
        this.books = backendBooks.map(b => ({
          id: b.bookId || (b as any).id,
          title: b.title,
          subtitle: b.description || 'Premium Engineering Resource',
          author: b.author,
          basePrice: b.price,
          quantity: b.quantity,
          rating: 4.8, 
          imgURL: b.imgURL || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400',
          formats: [
            { type: 'Hardcover', price: b.price }, 
            { type: 'E-Book', price: Number((b.price * 0.7).toFixed(2)) }
          ],
          selectedFormat: 'Hardcover',
          badge: b.quantity < 5 && b.quantity > 0 ? 'LOW STOCK' : undefined
        }));

        this.hasMoreBooks = backendBooks.length === this.pageSize;
        this.isLoadingBooks = false;
        
        this.calculateDynamicStats(); 
        this.triggerAnimations();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load books:', err);
        this.isLoadingBooks = false;
      }
    });
  }

  onSearch(): void {
    this.loadBooks(true);
  }

  nextPage(): void {
    if (this.hasMoreBooks) {
      this.currentPage++;
      this.loadBooks();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadBooks();
    }
  }

  filterByStack(stackName: string): void {
    this.activeStack = stackName;
    this.loadBooks(true);
  }

  // Connects to the real CartService using Keycloak Identity
  addToCart(book: AdvancedBook): void {
    if (book.quantity === 0) return;

    const tokenParsed: any = this.keycloak.tokenParsed;
    const userId = tokenParsed?.sub;

    if (!userId) {
      alert('Please log in to add items to your cart.');
      return;
    }

    this.cartService.addItemToCart(userId, {
      bookId: book.id,
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

  selectFormat(book: AdvancedBook, format: string, event: Event) {
    event.stopPropagation();
    book.selectedFormat = format;
  }

  calculateDynamicStats(): void {
    const totalBooks = this.books.length;
    const totalCategories = this.rawCategories.length;
    const totalStock = this.books.reduce((sum, book) => sum + book.quantity, 0);

    this.stats = [
      { label: 'Technical Titles', value: `${totalBooks}+` },
      { label: 'Engineering Stacks', value: `${totalCategories}` },
      { label: 'Books in Stock', value: `${totalStock}` },
      { label: 'Active Users', value: '12.4K+' } 
    ];
  }

  loadVideos(): void {
    this.videoService.getAllVideos().subscribe({
      next: (backendVideos) => {
        this.videos = backendVideos;
        this.triggerAnimations();
      },
      error: () => { console.warn('Video service not available yet.'); }
    });
  }

  loadLabs(): void {
    this.labService.getAllLabs().subscribe({
      next: (backendLabs) => {
        this.labs = backendLabs;
        this.triggerAnimations();
      },
      error: () => { console.warn('Lab service not available yet.'); }
    });
  }

  ngAfterViewInit(): void {
    if (this.heroVideo && this.heroVideo.nativeElement) {
      this.heroVideo.nativeElement.muted = true;
      this.heroVideo.nativeElement.play().catch(error => {
        console.warn('Browser prevented autoplay.', error);
      });
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { root: null, rootMargin: '0px 0px -100px 0px', threshold: 0.15 });

    this.triggerAnimations();
  }

  triggerAnimations(): void {
    setTimeout(() => {
      const animatedElements = this.el.nativeElement.querySelectorAll('.animate-on-scroll:not(.is-visible)');
      animatedElements.forEach((el: any) => this.observer.observe(el));
    }, 100);
  }
}