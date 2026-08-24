import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Category } from '../models/category';
import { Book } from '../models/book';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/categories`;

  getAllCategories(filters?: { keyword?: string; active?: boolean; page?: number; size?: number; sort?: string }): Observable<Category[]> {
    let params = new HttpParams();
    if (filters?.keyword) params = params.set('keyword', filters.keyword);
    if (filters?.active !== undefined) params = params.set('active', filters.active);
    if (filters?.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters?.size !== undefined) params = params.set('size', filters.size.toString());
    if (filters?.sort) params = params.set('sort', filters.sort);

    return this.http.get<Category[]>(this.apiUrl, { params });
  }

  getCategoryById(categoryId: string): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${categoryId}`);
  }

  getBooksByCategory(categoryId: string): Observable<Book[]> {
    return this.http.get<Book[]>(`${this.apiUrl}/${categoryId}/books`);
  }

  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  updateCategory(categoryId: string, category: Category): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${categoryId}`, category);
  }

  deleteCategory(categoryId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${categoryId}`);
  }
}