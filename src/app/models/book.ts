export interface Book {
  bookId?: string;
  title: string;
  author: string;
  description?: string;
  price: number;
  quantity: number;
  categoryId: string;
  imgURL?: string;
}