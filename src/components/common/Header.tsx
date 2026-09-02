import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../utils/theme';
import { useLocalization } from '../../hooks/useLocalization';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
  showLanguageToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onBack,
  showLanguageToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const { language, setLanguage } = useLocalization();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ml' : 'en');
  };

  // Accommodate Android status bar / punch holes and iOS dynamic islands
  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, androidStatusHeight, 16);

  return (
    <View style={[styles.header, { paddingTop: safeTop + 8 }]}>
      <View style={styles.leftContainer}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
        ) : null}
        {title ? <Text style={styles.title}>{title}</Text> : null}
      </View>

      {showLanguageToggle && (
        <TouchableOpacity
          onPress={toggleLanguage}
          style={styles.langBadge}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.langText}>
            {language === 'en' ? 'മലയാളം' : 'English'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    minHeight: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  backText: {
    fontSize: 26,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 28,
    marginTop: -2,
    marginRight: 2,
  },
  title: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  langBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  langText: {
    ...theme.typography.smallBold,
    color: theme.colors.primaryDark,
  },
});