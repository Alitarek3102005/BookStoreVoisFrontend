import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js'; // <-- Import Keycloak
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
import { CartService } from '../../../services/cart-service';
import { Book } from '../../../models/book';
import { ReviewService } from '../../../services/review-service';
import { ReviewResponse } from '../../../models/review-response';

@Component({
  selector: 'app-book-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './book-details.html',
  styleUrls: ['./book-details.css']
})
export class BookDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private bookService = inject(BookService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private reviewService = inject(ReviewService);
  private keycloak = inject(Keycloak); // <-- Inject Keycloak

  book!: Book;
  categoryName: string = 'General';
  isLoading: boolean = true;
  activeTab: 'description' | 'contents' | 'reviews' = 'description';
  quantityToCart: number = 1;

  reviews: ReviewResponse[] = [];
  newRating: number = 5;
  newComment: string = '';

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    
    if (bookId) {
      this.bookService.getAllBooks().subscribe({
        next: (books: Book[]) => {
          const found = books.find(b => (b.bookId || (b as any).id) === bookId);
          if (found) {
            this.book = found;
            const targetId = this.book.bookId || (this.book as any).id;
            this.loadCategoryName(this.book.categoryId);
            this.loadReviews(targetId);
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load book details:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadCategoryName(categoryId: string): void {
    if (!categoryId) return;
    this.categoryService.getAllCategories().subscribe({
      next: (categories: any[]) => {
        const cat = categories.find(c => (c.id || c.categoryId) === categoryId);
        if (cat) {
          this.categoryName = cat.name;
        }
      }
    });
  }

  loadReviews(bookId: string): void {
    this.reviewService.getReviewsByBook(bookId).subscribe({
      next: (data) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Failed to load reviews', err);
      }
    });
  }

  submitReview(): void {
    const tokenParsed: any = this.keycloak.tokenParsed;
    const userId = tokenParsed?.sub;

    if (!userId) {
      alert('You must be logged in to submit a review.');
      return;
    }

    const bookId = this.book.bookId || (this.book as any).id;
    const reviewPayload = {
      userId: userId,
      rating: Number(this.newRating),
      comment: this.newComment
    };

    this.reviewService.createReview(bookId, reviewPayload).subscribe({
      next: (createdReview) => {
        this.reviews.unshift(createdReview);
        this.newComment = '';
        this.newRating = 5;
        alert('Review submitted successfully!');
      },
      error: (err) => {
        console.error('Error submitting review', err);
        alert('Failed to submit review. You may have already reviewed this book.');
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  incrementQuantity(): void {
    if (this.quantityToCart < this.book.quantity) {
      this.quantityToCart++;
    }
  }

  decrementQuantity(): void {
    if (this.quantityToCart > 1) {
      this.quantityToCart--;
    }
  }

  addToCart(): void {
    if (this.book.quantity === 0) return;

    const tokenParsed: any = this.keycloak.tokenParsed;
    const userId = tokenParsed?.sub;

    if (!userId) {
      alert('Please log in to add items to your cart.');
      return;
    }

    const bookId = this.book.bookId || (this.book as any).id;
    
    this.cartService.addItemToCart(userId, {
      bookId: bookId,
      quantity: this.quantityToCart
    }).subscribe({
      next: () => {
        this.quantityToCart = 1;
        alert(`${this.book.title} added to your cart successfully!`);
      },
      error: (err) => {
        console.error('Failed to add item to cart', err);
        alert('Could not add item to cart. Check stock availability or user registration.');
      }
    });
  }

  get totalPrice(): string {
    if (!this.book) return '0.00';
    return (this.book.price * this.quantityToCart).toFixed(2);
  }
}