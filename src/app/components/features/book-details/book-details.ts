import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import Keycloak from 'keycloak-js';
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
  private keycloak = inject(Keycloak);

  book!: Book;
  categoryName: string = 'General';
  isLoading: boolean = true;
  activeTab: 'description' | 'contents' | 'reviews' = 'description';
  quantityToCart: number = 1;

  reviews: ReviewResponse[] = [];
  newRating: number = 5;
  newComment: string = '';

  // Current User & Edit State
  currentUserId: string | null = null;
  editingReviewId: string | null = null;
  editRating: number = 5;
  editComment: string = '';

  ngOnInit(): void {
    const tokenParsed: any = this.keycloak.tokenParsed;
    this.currentUserId = tokenParsed?.sub || null;

    const bookId = this.route.snapshot.paramMap.get('id');
    
    if (bookId) {
      // FIX: Use getBookById instead of getAllBooks to prevent pagination bugs
      this.bookService.getBookById(bookId).subscribe({
        next: (foundBook: Book) => {
          this.book = foundBook;
          const targetId = this.book.bookId || (this.book as any).id;
          
          if (this.book.categoryId) {
            this.loadCategoryName(this.book.categoryId);
          }
          this.loadReviews(targetId);
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
    
    // FIX: Use getCategoryById instead of getAllCategories
    this.categoryService.getCategoryById(categoryId).subscribe({
      next: (category: any) => {
        if (category) {
          this.categoryName = category.name;
        }
      },
      error: (err) => {
        console.error('Failed to load category details:', err);
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
    if (!this.currentUserId) {
      alert('You must be logged in to submit a review.');
      return;
    }

    const bookId = this.book.bookId || (this.book as any).id;
    const reviewPayload = {
      userId: this.currentUserId,
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

  startEditReview(rev: ReviewResponse): void {
    this.editingReviewId = rev.reviewId;
    this.editRating = rev.rating;
    this.editComment = rev.comment;
  }

  cancelEditReview(): void {
    this.editingReviewId = null;
  }

  saveEditedReview(reviewId: string): void {
    const patchData = {
      rating: Number(this.editRating),
      comment: this.editComment
    };

    this.reviewService.patchReview(reviewId, patchData).subscribe({
      next: (updatedReview) => {
        const index = this.reviews.findIndex(r => r.reviewId === reviewId);
        if (index !== -1) {
          this.reviews[index] = updatedReview;
        }
        this.editingReviewId = null;
      },
      error: (err) => {
        console.error('Failed to update review', err);
        alert('Failed to update review.');
      }
    });
  }

  deleteReview(reviewId: string): void {
    if (confirm('Are you sure you want to delete this review?')) {
      this.reviewService.deleteReview(reviewId).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.reviewId !== reviewId);
        },
        error: (err) => {
          console.error('Failed to delete review', err);
          alert('Failed to delete review.');
        }
      });
    }
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

    if (!this.currentUserId) {
      alert('Please log in to add items to your cart.');
      return;
    }

    const bookId = this.book.bookId || (this.book as any).id;
    
    this.cartService.addItemToCart(this.currentUserId, {
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