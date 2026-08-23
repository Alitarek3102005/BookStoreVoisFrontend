export interface CartItemResponse {
  cartItemId: string;
  bookId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}