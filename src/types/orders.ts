export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export type PricingStatus = 'fixed' | 'pending_verification' | 'finalized';

export type PaymentStatus =
  | 'unpaid'
  | 'payment_pending'
  | 'paid'
  | 'failed'
  | 'refunded';

export interface PaymentEligibility {
  online_payment_eligible: boolean;
  allowed_payment_methods: ('upi' | 'pay_at_store' | string)[];
  reason?: string | null;
  notice?: string | null;
}

export type MerchantFulfillmentAction =
  | 'accept'
  | 'reject'
  | 'start_preparing'
  | 'weigh_produce'
  | 'mark_ready_for_pickup'
  | 'confirm_pickup';

export interface WeighedItemInput {
  order_item_id?: number;
  product_id: number;
  actual_quantity: number;
  unit_price: number;
}

export interface OrderItem {
  order_item_id?: number;
  product_id: number;
  name: string;
  item_type?: 'master_linked' | 'standalone';
  pricing_type?: 'fixed' | 'store_priced';
  pricing_status?: 'fixed' | 'pending' | 'finalized';
  unit?: string | null;
  image?: string | null;
  price: number;
  quantity: number;
  requested_quantity?: number;
  actual_quantity?: number | null;
  item_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  pickup_code: string;
  shop_id: number;
  shop_name: string;
  shop_address?: string;
  shop_phone?: string;
  customer_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_note?: string | null;
  status: OrderStatus;
  fulfillment_status?: OrderStatus;
  pricing_status?: PricingStatus;
  payment_status?: PaymentStatus;
  is_total_final?: boolean;
  fixed_items_subtotal?: number;
  estimated_total?: number | null;
  final_total?: number | null;
  has_pending_prices?: boolean;
  requires_weighing?: boolean;
  available_actions?: MerchantFulfillmentAction[];
  rejection_reason?: string | null;
  payment_eligibility?: PaymentEligibility;
  items: OrderItem[];
  item_count: number;
  total_quantity: number;
  subtotal: number;
  total: number;
  pickup_type: 'pickup';
  created_at: string;
}

export interface CreateOrderPayload {
  shop_id: number;
  items: {
    product_id: number;
    quantity: number;
    is_variable?: boolean;
    pricing_type?: 'fixed' | 'store_priced';
  }[];
  customer_name: string;
  customer_phone: string;
  customer_note?: string;
  cart_session?: string;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data: {
    order: Order;
  };
}

export interface OrderListResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      total_pages: number;
    };
  };
}
