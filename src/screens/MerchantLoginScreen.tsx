import React, { useState } from 'react';
import { View, Text, StyleSheet,  ScrollView } from 'react-native';
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

interface MerchantLoginScreenProps {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'MerchantLogin'>;
}

export const MerchantLoginScreen: React.FC<MerchantLoginScreenProps> = ({ navigation }) => {
  const { login } = useAuth();
  const { t } = useLocalization();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    if (!validators.isRequired(username)) {
      errs.username = t('errors.requiredFields');
    }
    if (!validators.isRequired(password)) {
      errs.password = t('errors.requiredFields');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await login({ username: username.trim(), password });
      // Note: RootNavigator automatically verifies role. If merchant, switches to Merchant Area!
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
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>🏪 {t('roles.merchant')}</Text>
          </View>
          <Text style={styles.title}>{t('auth.merchantLoginTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.merchantLoginSubtitle')}</Text>
        </View>

        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

        <View style={styles.form}>
          <Input
            label={t('auth.usernameOrEmail')}
            placeholder={t('auth.usernameOrEmailPlaceholder')}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
            }}
            error={errors.username}
            autoCapitalize="none"
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
            title={t('auth.merchantSignIn')}
            variant="merchant"
            onPress={handleLogin}
            loading={submitting}
            style={styles.loginBtn}
          />
        </View>

        <View style={styles.noteBox}>
          <Text style={styles.noteTitle}>💡 Partner Notice</Text>
          <Text style={styles.noteText}>
            Only registered grocery and supermarket merchant partners can log in here. If you need to register a store, please visit our onboarding team.
          </Text>
        </View>
      </ScrollView>

      <LoadingOverlay visible={submitting} message={t('auth.loggingIn')} />
    </View>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
    justifyContent: 'space-between',
  },
  header: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.merchantLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm,
  },
  roleTagText: {
    ...theme.typography.caption,
    color: theme.colors.merchantDark,
    fontWeight: '700',
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
  loginBtn: {
    marginTop: theme.spacing.md,
  },
  noteBox: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xl,
  },
  noteTitle: {
    ...theme.typography.smallBold,
    color: theme.colors.text,
    marginBottom: 4,
  },
  noteText: {
    ...theme.typography.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});