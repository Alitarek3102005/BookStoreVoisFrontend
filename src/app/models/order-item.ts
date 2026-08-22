export interface OrderItem {
  orderItemId?: string;
  orderId: string; 
  bookId: string; 
  quantity: number;
  unitPrice: number;
}