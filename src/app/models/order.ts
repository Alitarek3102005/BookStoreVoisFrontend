import { OrderItem } from "./order-item";


export interface Order {
  orderId?: string; 
  customerId: string; 
  orderDate: string | Date;
  totalAmount: number;
  status: string;
  orderItems?: OrderItem[];
}