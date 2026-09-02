import React, { useState } from 'react';
import { View, Text, StyleSheet,  ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../utils/theme';
import { Header } from '../components/common/Header';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { useAuth } from '../hooks/useAuth';
import { useLocalization } from '../hooks/useLocalization';
import { validators } from '../utils/validators';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';

interface CustomerRegisterScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'CustomerRegister'>;
}

export const CustomerRegisterScreen: React.FC<CustomerRegisterScreenProps> = ({ navigation }) => {
  const { register, continueAsGuest } = useAuth();
  const { t } = useLocalization();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; password?: string }>({});

  const validate = () => {
    const errs: { name?: string; email?: string; phone?: string; password?: string } = {};
    if (!validators.isRequired(name)) {
      errs.name = t('errors.requiredFields');
    }
    if (!validators.isValidEmail(email)) {
      errs.email = t('errors.invalidEmail');
    }
    if (phone && !validators.isValidPhone(phone)) {
      errs.phone = t('errors.invalidPhone');
    }
    if (!validators.isValidPassword(password)) {
      errs.password = t('errors.shortPassword');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      // Automatically signs in and switches to Customer Area
    } catch (err: any) {
      setErrorMessage(err.message || t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.registerTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
        </View>

        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <View style={styles.form}>
          <Input
            label={t('auth.name')}
            placeholder={t('auth.namePlaceholder')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={errors.name}
          />

          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label={t('auth.phone')}
            placeholder={t('auth.phonePlaceholder')}
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <Input
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password}
            isPassword
          />

          <Button
            title={t('auth.signUp')}
            onPress={handleRegister}
            loading={submitting}
            style={styles.registerBtn}
          />

          <TouchableOpacity
            style={styles.guestBtn}
            activeOpacity={0.8}
            onPress={continueAsGuest}
          >
            <Text style={styles.guestBtnText}>📍 Skip for now & Explore Nearby Stores →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.hasAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('CustomerLogin')}>
            <Text style={styles.loginLink}>{t('auth.loginNow')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={submitting} message={t('auth.registering')} />
    </View>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.hero,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    flex: 1,
  },
  guestBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  guestBtnText: {
    ...theme.typography.smallBold,
    color: '#16a34a',
    fontSize: 14,
  },
  registerBtn: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    ...theme.typography.bodyBold,
    color: theme.colors.primary,
  },
});