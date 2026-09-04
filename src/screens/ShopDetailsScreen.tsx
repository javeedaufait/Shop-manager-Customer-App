import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';
import { theme } from '../utils/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ShopDetails'>;

export const ShopDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { shop } = route.params;

  const handleCall = () => {
    if (shop?.phone) {
      Linking.openURL(`tel:${shop.phone.replace(/\s+/g, '')}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Store Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Store Hero Image */}
        <View style={styles.heroContainer}>
          {shop.photo_url ? (
            <Image source={{ uri: shop.photo_url }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🏬</Text>
            </View>
          )}

          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>
              {shop.availability?.badge || 'Open Now'}
            </Text>
          </View>
        </View>

        {/* Store Identity Card */}
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Text style={styles.shopName}>{shop.name}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Verified</Text>
            </View>
          </View>
          <Text style={styles.shopType}>{shop.shop_type || 'Supermarket & Grocery'}</Text>
          {shop.distance_text && (
            <Text style={styles.distanceText}>📍 {shop.distance_text} from your location</Text>
          )}
        </View>

        {/* Quick Action Button */}
        {!!shop.phone && (
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.85}>
            <Text style={styles.callBtnIcon}>📞</Text>
            <Text style={styles.callBtnText}>Call Store: {shop.phone}</Text>
          </TouchableOpacity>
        )}

        {/* Store Location & Timings */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>Address & Location</Text>
          <Text style={styles.addressText}>{shop.address}</Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Operating Timings</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Standard Hours:</Text>
            <Text style={styles.infoValue}>{shop.availability?.timing || '7:30 AM - 10:00 PM'}</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionHeader}>Order & Pickup Policy</Text>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>⚡</Text>
            <Text style={styles.bulletText}>
              Click & Collect: Orders are packed and ready for pickup at the store express counter.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <Text style={styles.bulletDot}>🛡️</Text>
            <Text style={styles.bulletText}>
              Freshness Guarantee: Inspected by store staff before handover.
            </Text>
          </View>
        </View>

        {/* Store ID Tag */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>NearMart Partner Store #{shop.shop_id}</Text>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.browseCatalogBtn}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.browseCatalogBtnText}>Browse Store Catalog</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: theme.colors.text,
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  heroContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  heroEmoji: {
    fontSize: 60,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
  },
  verifiedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginLeft: 8,
  },
  verifiedText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  shopType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  callBtnIcon: {
    fontSize: 16,
  },
  callBtnText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 14,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  footerNote: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  browseCatalogBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  browseCatalogBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
