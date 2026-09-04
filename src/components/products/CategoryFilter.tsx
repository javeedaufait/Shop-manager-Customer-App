import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { theme } from '../../utils/theme';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  allLabel?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  allLabel = 'All',
}) => {
  const allCategories = [allLabel, ...categories];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCategories.map((cat, idx) => {
          const isSelected =
            selectedCategory === cat ||
            (cat === allLabel && (selectedCategory === '' || selectedCategory === 'All'));

          return (
            <TouchableOpacity
              key={cat + '_' + idx}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => onSelectCategory(cat === allLabel ? 'All' : cat)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
