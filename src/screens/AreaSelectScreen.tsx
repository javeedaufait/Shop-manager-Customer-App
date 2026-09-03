import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/common/Header';
import { theme } from '../utils/theme';
import { useLocalization } from '../hooks/useLocalization';
import { useLocation } from '../hooks/useLocation';
import { shopsApi } from '../api/shopsApi';
import { AreaHub } from '../types/shops';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CustomerStackParamList } from '../navigation/types';

interface AreaSelectScreenProps {
  navigation: NativeStackNavigationProp<CustomerStackParamList, 'AreaSelect'>;
}

const DEFAULT_POPULAR_AREAS: AreaHub[] = [
  { id: 'edappally', name: 'Edappally, Kochi', is_hub: true },
  { id: 'palarivattom', name: 'Palarivattom, Kochi', is_hub: true },
  { id: 'kaloor', name: 'Kaloor, Kochi', is_hub: true },
  { id: 'kakkanad', name: 'Kakkanad, Kochi', is_hub: true },
  { id: 'fort-kochi', name: 'Fort Kochi', is_hub: true },
  { id: 'aluva', name: 'Aluva, Ernakulam', is_hub: true },
  { id: 'kozhikode-city', name: 'Kozhikode City', is_hub: true },
  { id: 'thrissur-round', name: 'Thrissur Round', is_hub: true },
  { id: 'trivandrum-city', name: 'Trivandrum City', is_hub: true },
];

export const AreaSelectScreen: React.FC<AreaSelectScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  const { selectArea } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState<AreaHub[]>(DEFAULT_POPULAR_AREAS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const resp = await shopsApi.getAreas();
        if (isMounted && resp?.areas?.length > 0) {
          setAreas(resp.areas);
        }
      } catch (err) {
        console.warn('Using default area hubs due to API fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAreas = areas.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleSelectArea = async (areaName: string) => {
    await selectArea(areaName);
    navigation.replace('NearbyShops');
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Header
        title={t('location.selectAreaTitle')}
        onBack={() => navigation.goBack()}
      />

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('location.searchAreaPlaceholder')}
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredAreas}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionHeader}>
              {searchQuery ? t('common.search') : t('location.popularAreas')}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.areaRow}
              onPress={() => handleSelectArea(item.name)}
            >
              <View style={styles.areaLeft}>
                <View style={styles.pinCircle}>
                  <Text style={styles.pinEmoji}>📍</Text>
                </View>
                <Text style={styles.areaName}>{item.name}</Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📍</Text>
              <Text style={styles.emptyTitle}>No matching areas found</Text>
              <TouchableOpacity
                style={styles.customAreaBtn}
                onPress={() => handleSelectArea(searchQuery.trim())}
              >
                <Text style={styles.customAreaBtnText}>
                  Use "{searchQuery.trim()}" as custom location
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    height: 48,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text,
    height: '100%',
  },
  clearIcon: {
    fontSize: 14,
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
  },
  loadingWrap: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  sectionHeader: {
    ...theme.typography.smallBold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  areaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  pinCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinEmoji: {
    fontSize: 16,
  },
  areaName: {
    ...theme.typography.subtitle,
    fontSize: 15,
    color: theme.colors.text,
    flex: 1,
  },
  arrowIcon: {
    fontSize: 22,
    color: theme.colors.textMuted,
    fontWeight: '300',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
    gap: theme.spacing.md,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  customAreaBtn: {
    backgroundColor: theme.colors.primaryLight,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  customAreaBtnText: {
    ...theme.typography.smallBold,
    color: theme.colors.primaryDark,
  },
});