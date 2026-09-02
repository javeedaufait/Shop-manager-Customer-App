export interface ShopAvailability {
  status: 'open' | 'closed';
  badge: string;
  timing: string;
  pickup_ready?: boolean;
}

export interface Shop {
  shop_id: number;
  name: string;
  shop_type: string;
  photo_url: string | null;
  address: string;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  distance_text: string | null;
  status: string;
  is_open: boolean;
  availability: ShopAvailability;
}

export interface AreaHub {
  id: string;
  name: string;
  is_hub: boolean;
}

export interface NearbyShopsResponse {
  shops: Shop[];
  user_location: {
    latitude: number;
    longitude: number;
    radius_km: number;
  } | null;
  filter_area: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface UserLocationState {
  latitude: number | null;
  longitude: number | null;
  areaName: string;
  isGps: boolean;
}