import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useLocalization } from '../hooks/useLocalization';
import { storageService } from '../services/storageService';
import { ENV } from '../config/env';
import { theme } from '../utils/theme';

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;
}

interface SlideItem {
  id: string;
  badgeKey: string;
  icon: string;
  iconBg: string;
  titleKey: string;
  descKey: string;
  points: string[];
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t, language, setLanguage } = useLocalization();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: SlideItem[] = [
    {
      id: 'slide-1',
      badgeKey: 'onboarding.slide1Badge',
      icon: '🏬',
      iconBg: '#EFF6FF',
      titleKey: 'onboarding.slide1Title',
      descKey: 'onboarding.slide1Desc',
      points: [
        'onboarding.slide1Point1',
        'onboarding.slide1Point2',
        'onboarding.slide1Point3',
      ],
    },
    {
      id: 'slide-2',
      badgeKey: 'onboarding.slide2Badge',
      icon: '⚡',
      iconBg: '#FFFBEB',
      titleKey: 'onboarding.slide2Title',
      descKey: 'onboarding.slide2Desc',
      points: [
        'onboarding.slide2Step1',
        'onboarding.slide2Step2',
        'onboarding.slide2Step3',
      ],
    },
    {
      id: 'slide-3',
      badgeKey: 'onboarding.slide3Badge',
      icon: '🤝',
      iconBg: '#ECFDF5',
      titleKey: 'onboarding.slide3Title',
      descKey: 'onboarding.slide3Desc',
      points: [
        'onboarding.slide3Point1',
        'onboarding.slide3Point2',
        'onboarding.slide3Point3',
      ],
    },
  ];

  const handleFinish = async () => {
    try {
      await storageService.setItem(ENV.storageKeys.onboardingCompleted, 'true');
    } catch (e) {
      console.warn('Failed to save onboarding completed state:', e);
    }
    navigation.replace('Welcome');
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'ml' : 'en';
    setLanguage(nextLang);
  };

  const androidStatusHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;
  const safeTop = Math.max(insets.top, androidStatusHeight, 16);

  return (
    <View style={[styles.container, { paddingTop: safeTop, paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Top Bar: Language Switcher & Skip Button */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.langPill}
          activeOpacity={0.8}
          onPress={toggleLanguage}
        >
          <Text style={styles.langIcon}>🌐</Text>
          <Text style={styles.langText}>
            {language === 'en' ? 'മലയാളം' : 'English'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          activeOpacity={0.7}
          onPress={handleFinish}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { width }]}>
            {/* Visual Badge / Icon */}
            <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
              <Text style={styles.iconGraphic}>{item.icon}</Text>
            </View>

            {/* Category Tag */}
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{t(item.badgeKey as any)}</Text>
            </View>

            {/* Title & Description */}
            <Text style={styles.title}>{t(item.titleKey as any)}</Text>
            <Text style={styles.description}>{t(item.descKey as any)}</Text>

            {/* Bullet Points / Highlights Card */}
            <View style={styles.pointsCard}>
              {item.points.map((ptKey: string, idx: number) => (
                <View key={idx} style={styles.pointRow}>
                  <View style={styles.checkBullet}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <Text style={styles.pointText}>{t(ptKey as any)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      {/* Bottom Footer: Dots & Next Action */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                currentIndex === i ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Next / Get Started Button */}
        <TouchableOpacity
          style={styles.nextBtn}
          activeOpacity={0.85}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === slides.length - 1
              ? `${t('onboarding.getStarted')} ›`
              : `${t('onboarding.next')} ›`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  langIcon: {
    fontSize: 14,
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  skipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...theme.shadows.sm,
  },
  iconGraphic: {
    fontSize: 46,
  },
  badgeWrap: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  pointsCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  pointText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: 'center',
    gap: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: theme.colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#CBD5E1',
  },
  nextBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
