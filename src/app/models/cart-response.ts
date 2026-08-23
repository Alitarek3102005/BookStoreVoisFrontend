import { CartItemResponse } from "./cart-item-response";

export interface CartResponse {
  cartId: string;
  userId: string;
  totalAmount: number;
  items: CartItemResponse[];
}