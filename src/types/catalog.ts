/**
 * Product & Catalog Types for NearMart Customer App
 * Consistent customer-facing product structure (no master/standalone terminology).
 */

export interface Product {
  id: number;
  name: string;
  description?: string;
  image: string | null;
  category: string;
  brand?: string | null;
  unit?: string | null;
  barcode?: string | null;
  price: number;
  sale_price?: number | null;
  available: boolean;
  stock_quantity?: number | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ShopProductsResponse {
  products: Product[];
  pagination: PaginationInfo;
}

export interface CategoryItem {
  id: string;
  name: string;
  count?: number;
}
