import { ApiErrorResponse } from '../types/api';
import { t } from '../i18n';

export class AppError extends Error {
  code: string;
  details?: Record<string, any>;

  constructor(message: string, code = 'APP_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export const parseApiError = (error: any): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  // If response matches NearMart ApiErrorResponse format
  if (error?.response?.data) {
    const data: ApiErrorResponse = error.response.data;
    if (data && data.success === false) {
      // Map well-known NearMart backend error codes to friendly localized text
      switch (data.error_code) {
        case 'INVALID_CREDENTIALS':
          return new AppError(t('errors.invalidCredentials'), data.error_code, data.details);
        case 'EMAIL_EXISTS':
          return new AppError(t('errors.emailExists'), data.error_code, data.details);
        case 'INVALID_EMAIL':
          return new AppError(t('errors.invalidEmail'), data.error_code, data.details);
        case 'WEAK_PASSWORD':
          return new AppError(t('errors.shortPassword'), data.error_code, data.details);
        case 'rest_not_logged_in':
        case 'UNAUTHORIZED':
          return new AppError(t('errors.unauthorized'), 'UNAUTHORIZED', data.details);
        default:
          return new AppError(data.message || t('errors.generic'), data.error_code, data.details);
      }
    }
  }

  // Network or connection errors
  if (error?.message === 'Network Error' || error?.code === 'ECONNABORTED' || error?.message?.includes('network')) {
    return new AppError(t('errors.network'), 'NETWORK_ERROR');
  }

  return new AppError(error?.message || t('errors.generic'), 'UNKNOWN_ERROR');
};