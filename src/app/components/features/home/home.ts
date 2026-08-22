import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home implements OnInit, AfterViewInit {
  @ViewChild('heroVideo') heroVideo!: ElementRef<HTMLVideoElement>;

  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private videoService = inject(VideoService);
  private labService = inject(LabService);

  private observer!: IntersectionObserver;

  // Stats will now be calculated dynamically from the database
  stats: { label: string; value: string }[] = [];
  
  rawCategories: any[] = [];
  stacks: string[] = ['All'];
  activeStack = 'All';
  
  books: AdvancedBook[] = [];
  videos: Video[] = [];
  labs: Lab[] = [];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadBooks();
    this.loadVideos();
    this.loadLabs();
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe(categories => {
      this.rawCategories = categories;
      this.stacks = ['All', ...categories.map(c => c.name)];
      this.calculateDynamicStats(); // Update stats when categories load
    });
  }

  loadBooks(categoryId?: string): void {
    this.bookService.getAllBooks({ categoryId }).subscribe(backendBooks => {
      this.books = backendBooks.map(b => ({
        id: b.bookId || '',
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
        badge: b.quantity < 5 ? 'LOW STOCK' : undefined
      }));

      this.calculateDynamicStats(); // Update stats when books load
      this.triggerAnimations();
    });
  }

  // Fetch from the backend!
  loadVideos(): void {
    this.videoService.getAllVideos().subscribe(backendVideos => {
      this.videos = backendVideos;
      this.triggerAnimations();
    });
  }

  // Fetch from the backend!
  loadLabs(): void {
    this.labService.getAllLabs().subscribe(backendLabs => {
      this.labs = backendLabs;
      this.triggerAnimations();
    });
  }

  // Dynamically calculate statistics based on what is actually in PostgreSQL
  calculateDynamicStats(): void {
    const totalBooks = this.books.length;
    const totalCategories = this.rawCategories.length;
    const totalStock = this.books.reduce((sum, book) => sum + book.quantity, 0);

    this.stats = [
      { label: 'Technical Titles', value: `${totalBooks}+` },
      { label: 'Engineering Stacks', value: `${totalCategories}` },
      { label: 'Books in Stock', value: `${totalStock}` },
      { label: 'Active Users', value: '12.4K+' } // We would need a UserService call for this!
    ];
  }

  filterByStack(stackName: string): void {
    this.activeStack = stackName;
    
    if (stackName === 'All') {
      this.loadBooks();
    } else {
      const category = this.rawCategories.find(c => c.name === stackName);
      if (category) {
        this.loadBooks(category.id);
      }
    }
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

  selectFormat(book: AdvancedBook, format: string, event: Event) {
    event.stopPropagation();
    book.selectedFormat = format;
  }
}