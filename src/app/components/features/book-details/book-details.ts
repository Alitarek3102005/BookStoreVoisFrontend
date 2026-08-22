import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BookService } from '../../../services/book-service';
import { CategoryService } from '../../../services/category-service';
import { CartService } from '../../../services/cart-service'; // <-- Add your CartService import
import { Book } from '../../../models/book';

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
  private cartService = inject(CartService); // <-- Inject the CartService here

  book!: Book;
  categoryName: string = 'General';
  isLoading: boolean = true;
  activeTab: 'description' | 'contents' | 'reviews' = 'description';
  quantityToCart: number = 1;

  ngOnInit(): void {
    const bookId = this.route.snapshot.paramMap.get('id');
    
    if (bookId) {
      this.bookService.getAllBooks().subscribe({
        next: (books: Book[]) => {
          const found = books.find(b => (b.bookId || (b as any).id) === bookId);
          if (found) {
            this.book = found;
            this.loadCategoryName(this.book.categoryId);
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

    const cartItem = {
      bookId: this.book.bookId || (this.book as any).id,
      title: this.book.title,
      price: this.book.price,
      quantity: this.quantityToCart,
      imgURL: this.book.imgURL || ''
    };

    this.cartService.addToCart(cartItem);

    this.quantityToCart = 1;
    alert(`${this.book.title} added to your cart!`); 
  }
  get totalPrice(): string {
    if (!this.book) return '0.00';
    return (this.book.price * this.quantityToCart).toFixed(2);
  }
}