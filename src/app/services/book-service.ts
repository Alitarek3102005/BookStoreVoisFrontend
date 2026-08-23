import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Book } from '../models/book';

@Injectable({ providedIn: 'root' })
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/books`;

  searchBooks(title?: string, author?: string, categoryId?: string, page: number = 0, size: number = 8, sort?: string): Observable<Book[]> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (title) params = params.set('title', title);
    if (author) params = params.set('author', author);
    if (categoryId) params = params.set('categoryId', categoryId);
    if (sort) params = params.set('sort', sort);

    return this.http.get<Book[]>(this.apiUrl, { params });
  }

  getAllBooks(filters?: { title?: string; author?: string; categoryId?: string; page?: number; size?: number; sort?: string }): Observable<Book[]> {
    let params = new HttpParams();
    if (filters?.title) params = params.set('title', filters.title);
    if (filters?.author) params = params.set('author', filters.author);
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters?.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters?.sort) params = params.set('sort', filters.sort);

    return this.http.get<Book[]>(this.apiUrl, { params });
  }

  getBookById(bookId: string): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${bookId}`);
  }

  createBook(book: Book): Observable<Book> {
    return this.http.post<Book>(this.apiUrl, book);
  }

  updateBook(bookId: string, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.apiUrl}/${bookId}`, book);
  }

  patchBook(bookId: string, patchData: Partial<Book>): Observable<Book> {
    return this.http.patch<Book>(`${this.apiUrl}/${bookId}`, patchData);
  }

  deleteBook(bookId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${bookId}`);
  }
}