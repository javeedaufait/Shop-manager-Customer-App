export interface CartItem {
  item_id: string;
  product_id: number;
  shop_id: number;
  name: string;
  image: string | null;
  unit?: string | null;
  price: number;
  quantity: number;
  item_total: number;
}

export interface Cart {
  shop_id: number | null;
  shop_name: string | null;
  items: CartItem[];
  item_count: number;
  total_quantity: number;
  subtotal: number;
  session_token?: string;
}

export interface CartConflict {
  current_shop_id: number;
  current_shop_name: string;
  new_shop_id: number;
  new_shop_name: string;
}

export interface AddToCartPayload {
  shop_id: number;
  shop_name?: string;
  product_id: number;
  name: string;
  image?: string | null;
  unit?: string | null;
  price: number;
  quantity?: number;
  replace_cart?: boolean;
}
