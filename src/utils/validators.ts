export const validators = {
  isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  },

  isValidPhone(phone: string): boolean {
    // 10 digits for Indian mobile numbers or general standard format
    const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  },

  isValidPassword(password: string): boolean {
    return password.length >= 6;
  },

  isRequired(value: string | undefined | null): boolean {
    return !!value && value.trim().length > 0;
  },
};