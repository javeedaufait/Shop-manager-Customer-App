import { apiClient } from './client';
import { NearbyShopsResponse, AreaHub, Shop } from '../types/shops';

export interface NearbyShopsParams {
  lat?: number | null;
  lng?: number | null;
  radius?: number;
  area?: string;
  search?: string;
  page?: number;
  limit?: number;
}

const FALLBACK_SHOPS: Shop[] = [
  {
    shop_id: 101,
    name: 'Fresh Mart Supermarket',
    shop_type: 'Supermarket & Fresh Produce',
    photo_url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=60',
    address: 'Near Metro Station, Edappally, Kochi',
    phone: '+91 98470 12345',
    latitude: 9.9816,
    longitude: 76.2999,
    distance_km: 0.8,
    distance_text: '800 m',
    status: 'verified',
    is_open: true,
    availability: {
      status: 'open',
      badge: 'Open Now',
      timing: '7:30 AM - 10:30 PM',
      pickup_ready: true,
    },
  },
  {
    shop_id: 102,
    name: 'Grand Daily Hypermarket',
    shop_type: 'Hypermarket & Organic Grocery',
    photo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=60',
    address: 'Civil Line Road, Palarivattom, Kochi',
    phone: '+91 98471 67890',
    latitude: 10.0033,
    longitude: 76.3082,
    distance_km: 1.4,
    distance_text: '1.4 km',
    status: 'verified',
    is_open: true,
    availability: {
      status: 'open',
      badge: 'Open Now',
      timing: '8:00 AM - 10:00 PM',
      pickup_ready: true,
    },
  },
  {
    shop_id: 103,
    name: 'Nilgiris Daily & Bakery',
    shop_type: 'Dairy, Bakery & Essentials',
    photo_url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=600&auto=format&fit=crop&q=60',
    address: 'Kaloor Kadavanthra Road, Kaloor, Kochi',
    phone: '+91 98472 54321',
    latitude: 9.9922,
    longitude: 76.2911,
    distance_km: 2.1,
    distance_text: '2.1 km',
    status: 'verified',
    is_open: true,
    availability: {
      status: 'open',
      badge: 'Open Now',
      timing: '7:00 AM - 9:30 PM',
      pickup_ready: true,
    },
  },
  {
    shop_id: 104,
    name: 'Heritage Spices & Grocery',
    shop_type: 'Specialty Grocery & Spices',
    photo_url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=60',
    address: 'Bazaar Road, Fort Kochi',
    phone: '+91 98473 98765',
    latitude: 9.9656,
    longitude: 76.2421,
    distance_km: 6.5,
    distance_text: '6.5 km',
    status: 'verified',
    is_open: true,
    availability: {
      status: 'open',
      badge: 'Open Now',
      timing: '8:30 AM - 9:00 PM',
      pickup_ready: true,
    },
  },
];

function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const shopsApi = {
  /**
   * Fetch nearby shops with optional GPS coordinates, radius, or area text filter.
   */
  async getNearbyShops(params: NearbyShopsParams = {}): Promise<NearbyShopsResponse> {
    const queryParams: Record<string, string | number> = {};

    if (params.lat !== undefined && params.lat !== null) queryParams.lat = params.lat;
    if (params.lng !== undefined && params.lng !== null) queryParams.lng = params.lng;
    if (params.radius) queryParams.radius = params.radius;
    if (params.area) queryParams.area = params.area;
    if (params.search) queryParams.search = params.search;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;

    try {
      const response = await apiClient.get<NearbyShopsResponse>('/shops/nearby', queryParams);
      if (response && Array.isArray(response.shops)) {
        return response;
      }
    } catch (err) {
      console.warn('Backend /shops/nearby unreachable, using resilient offline discovery:', err);
    }

    // Resilient Fallback with Live Distance Computation
    let list = [...FALLBACK_SHOPS];

    if (params.lat && params.lng) {
      list = list.map((shop) => {
        if (shop.latitude && shop.longitude) {
          const dist = calculateHaversine(params.lat!, params.lng!, shop.latitude, shop.longitude);
          return {
            ...shop,
            distance_km: dist,
            distance_text: dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist} km`,
          };
        }
        return shop;
      });
      list.sort((a, b) => (a.distance_km || 999) - (b.distance_km || 999));
    }

    if (params.area) {
      const areaLow = params.area.toLowerCase();
      const areaMatches = list.filter(
        (s) =>
          s.address.toLowerCase().includes(areaLow) ||
          s.name.toLowerCase().includes(areaLow)
      );
      if (areaMatches.length > 0) {
        list = areaMatches;
      }
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shop_type.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      );
    }

    return {
      shops: list,
      user_location:
        params.lat && params.lng
          ? {
              latitude: params.lat,
              longitude: params.lng,
              radius_km: params.radius || 30,
            }
          : null,
      filter_area: params.area || null,
      pagination: {
        page: 1,
        limit: 20,
        total: list.length,
        total_pages: 1,
      },
    };
  },

  /**
   * Fetch discoverable areas for manual selection.
   */
  async getAreas(): Promise<{ areas: AreaHub[] }> {
    try {
      const resp = await apiClient.get<{ areas: AreaHub[] }>('/areas');
      if (resp?.areas?.length > 0) {
        return resp;
      }
    } catch (err) {
      console.warn('Backend /areas unreachable, using local hubs:', err);
    }

    return {
      areas: [
        { id: 'edappally', name: 'Edappally, Kochi', is_hub: true },
        { id: 'palarivattom', name: 'Palarivattom, Kochi', is_hub: true },
        { id: 'kaloor', name: 'Kaloor, Kochi', is_hub: true },
        { id: 'kakkanad', name: 'Kakkanad, Kochi', is_hub: true },
        { id: 'fort-kochi', name: 'Fort Kochi', is_hub: true },
        { id: 'aluva', name: 'Aluva, Ernakulam', is_hub: true },
        { id: 'kozhikode-city', name: 'Kozhikode City', is_hub: true },
        { id: 'thrissur-round', name: 'Thrissur Round', is_hub: true },
        { id: 'trivandrum-city', name: 'Trivandrum City', is_hub: true },
      ],
    };
  },
};