import { OrderItemLine } from "./order-item-line";

export interface OrderRequest {
  userId: string;
  items: OrderItemLine[];
}