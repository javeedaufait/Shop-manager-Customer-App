import { ENV } from '../config/env';
import { ApiResponse } from '../types/api';
import { storageService } from '../services/storageService';
import { parseApiError } from '../services/errorHandler';
import { getI18nLanguage } from '../i18n';

function encodeBase64(input: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(input);
    }
  } catch (e) {
    // Fallback
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input;
  let output = '';
  for (
    let block = 0, charCode = 0, i = 0, map = chars;
    str.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = str.charCodeAt((i += 3 / 4));
    if (charCode > 0xff) {
      throw new Error('Base64 encoding failed: characters outside Latin1 range.');
    }
    block = (block << 8) | charCode;
  }
  return output;
}

class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private basicAuthHeader: string | null = null;

  constructor() {
    let rawUrl = ENV.apiUrl;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.username && parsed.password) {
        this.basicAuthHeader = `Basic ${encodeBase64(`${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password)}`)}`;
        // Strip credentials from baseUrl to keep clean
        parsed.username = '';
        parsed.password = '';
        this.baseUrl = parsed.toString().replace(/\/$/, '');
      } else {
        this.baseUrl = rawUrl;
      }
    } catch (e) {
      this.baseUrl = rawUrl;
    }
  }

  public setToken(token: string | null) {
    this.authToken = token;
  }

  public async getStoredToken(): Promise<string | null> {
    if (!this.authToken) {
      this.authToken = await storageService.getSecureItem(ENV.storageKeys.authToken);
    }
    return this.authToken;
  }

  private async buildHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...customHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      // Keep tunnel basic auth in X-Tunnel header if needed
      if (this.basicAuthHeader) {
        headers['X-Tunnel-Authorization'] = this.basicAuthHeader;
      }
    } else if (this.basicAuthHeader) {
      headers['Authorization'] = this.basicAuthHeader;
    }

    return headers;
  }

  private buildUrl(path: string, params: Record<string, any> = {}): string {
    const fullUrl = path.startsWith('http') ? path : `${this.baseUrl}${path}`;
    const url = new URL(fullUrl);

    // Automatically append active app language
    url.searchParams.set('lang', getI18nLanguage());

    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, String(params[key]));
      }
    });

    return url.toString();
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const headers = await this.buildHeaders();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ENV.apiTimeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const json = await response.json().catch(() => null);

      if (!response.ok || (json && json.success === false)) {
        throw parseApiError({
          response: {
            status: response.status,
            data: json,
          },
        });
      }

      // Unwrap NearMart standard response envelope { success: true, data: T, message }
      if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
        return json.data as T;
      }

      return json as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error?.name === 'AbortError') {
        throw parseApiError({ message: 'Request timeout', code: 'ECONNABORTED' });
      }
      throw parseApiError(error);
    }
  }

  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  post<T>(path: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>('POST', path, data, params);
  }

  put<T>(path: string, data?: any, params?: Record<string, any>): Promise<T> {
    return this.request<T>('PUT', path, data, params);
  }

  delete<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>('DELETE', path, undefined, params);
  }
}

export const apiClient = new ApiClient();