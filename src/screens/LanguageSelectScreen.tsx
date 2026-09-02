import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
import { Button } from '../components/common/Button';
import { useLocalization } from '../hooks/useLocalization';
import { SupportedLanguage } from '../config/env';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

interface LanguageSelectScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'LanguageSelect'>;
}

export const LanguageSelectScreen: React.FC<LanguageSelectScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLocalization();
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>(language);

  const handleSelect = (lang: SupportedLanguage) => {
    setSelectedLang(lang);
    setLanguage(lang);
  };

  const handleContinue = () => {
    navigation.navigate('Welcome');
  };

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, androidStatusHeight, 16);

  return (
    <View style={[styles.container, { paddingTop: safeTop + 16, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('language.selectTitle')}</Text>
        <Text style={styles.subtitle}>{t('language.selectSubtitle')}</Text>
      </View>

      <View style={styles.optionsContainer}>
        {/* English Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.optionCard,
            selectedLang === 'en' && styles.selectedCard,
          ]}
          onPress={() => handleSelect('en')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>English</Text>
            <Text style={styles.optionMeta}>Default language</Text>
          </View>
          <View style={[styles.radioCircle, selectedLang === 'en' && styles.radioActive]}>
            {selectedLang === 'en' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Malayalam Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={[
            styles.optionCard,
            selectedLang === 'ml' && styles.selectedCard,
          ]}
          onPress={() => handleSelect('ml')}
        >
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>മലയാളം</Text>
            <Text style={styles.optionMeta}>Malayalam</Text>
          </View>
          <View style={[styles.radioCircle, selectedLang === 'ml' && styles.radioActive]}>
            {selectedLang === 'ml' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Button
          title={t('common.continue')}
          onPress={handleContinue}
          style={styles.continueBtn}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.md,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.subtitle,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  optionsContainer: {
    gap: theme.spacing.base,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.sm,
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  optionContent: {
    gap: 2,
  },
  optionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.text,
  },
  optionMeta: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#ffffff',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
  },
  footer: {
    marginBottom: theme.spacing.base,
  },
  continueBtn: {
    width: '100%',
  },
});