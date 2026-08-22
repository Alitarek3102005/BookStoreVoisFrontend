import { OrderItemLine } from "./order-item-line";

export interface OrderResponse {
  orderId: string;
  userId?: string;
  totalAmount: number;
  status?: string;
  orderDate?: string;
  items?: OrderItemLine[];
}