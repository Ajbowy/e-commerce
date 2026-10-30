export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  unitPriceKobo: number;
  quantity: number;
  imageUrl?: string | null;
}

export type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity?: number }
  | { type: "remove"; productId: string }
  | { type: "updateQuantity"; productId: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

export const CART_STORAGE_KEY = "ecommerce.cart.v1";

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const quantity = action.quantity ?? 1;
      const existing = state.find((item) => item.productId === action.item.productId);
      if (existing) {
        return state.map((item) =>
          item.productId === action.item.productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...state, { ...action.item, quantity }];
    }
    case "remove":
      return state.filter((item) => item.productId !== action.productId);
    case "updateQuantity":
      if (action.quantity <= 0) {
        return state.filter((item) => item.productId !== action.productId);
      }
      return state.map((item) =>
        item.productId === action.productId ? { ...item, quantity: action.quantity } : item
      );
    case "clear":
      return [];
    case "hydrate":
      return action.items;
    default:
      return state;
  }
}

export function cartSubtotalKobo(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0);
}
