import { Shop } from '../types/shops';
import { Product } from '../types/catalog';

export type AuthStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  Welcome: undefined;
  CustomerLogin: undefined;
  CustomerRegister: undefined;
  MerchantLogin: undefined;
};

export type CustomerStackParamList = {
  NearbyShops: undefined;
  LocationPermission: undefined;
  AreaSelect: undefined;
  CustomerHome: undefined;
  ShopCatalog: { shopId: number; shopName: string; shop?: Shop };
  ShopDetails: { shopId: number; shop: Shop };
  ProductDetail: { product: Product; shopName: string };
  Cart: undefined;
};

export type MerchantStackParamList = {
  MerchantHome: undefined;
};
