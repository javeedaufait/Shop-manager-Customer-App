# NearMart Mobile Application (React Native)
**Phase APP-3: Foundation & Authentication Layer**

This repository contains the official mobile application foundation for **NearMart**, supporting both **Customer** and **Merchant** user personas with seamless queue-free neighborhood grocery ordering and catalog management.

---

## 1. Project Architecture

The application is built with a strictly decoupled 3-tier architecture communicating with the NearMart WordPress/WooCommerce backend through the versioned `/wp-json/nearmart/v1/` REST API namespace.

```
┌─────────────────────────────────────────────────────────┐
│              NearMart Mobile App (React Native)         │
│           [ Customer Persona ]    [ Merchant Persona ]   │
└────────────────────────────┬────────────────────────────┘
                             │ HTTPS / Bearer Tokens / JSON
                             ▼
┌─────────────────────────────────────────────────────────┐
│            NearMart REST API Gateway (WordPress)        │
│                /wp-json/nearmart/v1/auth/...            │
└────────────────────────────┬────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│     NearMart Business Logic, Hybrid Catalog & Database  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
E:\ai projects\nearmart\
├── App.tsx                    # Application root with SafeArea & AuthProvider
├── index.js                   # Expo/React Native entry point
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── app.json                   # Expo application manifest
└── src/
    ├── api/                   # REST API client & endpoints
    │   ├── client.ts          # Fetch client with token injection & error unwrapping
    │   ├── authApi.ts         # Register, Login, Logout, Me, Profile endpoints
    │   └── endpoints.ts       # Centralized REST routes
    ├── components/common/     # Reusable UI Design System
    │   ├── Button.tsx         # Primary, Secondary, Merchant, Outline, Loading
    │   ├── Input.tsx          # Floating label, secure toggle, validation errors
    │   ├── Card.tsx           # Elevated card surface
    │   ├── Header.tsx         # Screen header with back button & language toggle
    │   ├── LoadingOverlay.tsx # Modal loading spinner
    │   ├── ErrorBanner.tsx    # Dismissible error banner
    │   └── RoleBadge.tsx      # Visual role pills (Customer / Merchant / Admin)
    ├── config/                # Environment configuration
    │   └── env.ts             # Dev & Prod base URLs, storage keys, timeouts
    ├── hooks/                 # Custom React hooks
    │   ├── useAuth.ts         # Authentication context consumer
    │   └── useLocalization.ts # Active language & translation helper
    ├── i18n/                  # Bilingual localization
    │   ├── en.ts              # English string dictionary
    │   ├── ml.ts              # Malayalam (മലയാളം) string dictionary
    │   └── index.ts           # Translation engine with fallback & interpolation
    ├── navigation/            # Navigation stacks & role routing
    │   ├── RootNavigator.tsx  # Dynamic switcher (Auth vs Customer vs Merchant)
    │   ├── AuthNavigator.tsx  # Splash, Language, Welcome, Login, Register
    │   ├── CustomerNavigator.tsx # Authenticated Customer area
    │   ├── MerchantNavigator.tsx # Authenticated Merchant partner area
    │   └── types.ts           # Navigation route prop types
    ├── screens/               # Mobile screens
    │   ├── SplashScreen.tsx   # Initial boot & token validation
    │   ├── LanguageSelectScreen.tsx # Interactive English vs Malayalam picker
    │   ├── WelcomeScreen.tsx  # NearMart value proposition & role choice
    │   ├── CustomerLoginScreen.tsx    # Customer credentials login
    │   ├── CustomerRegisterScreen.tsx # Customer account creation
    │   ├── MerchantLoginScreen.tsx    # Merchant partner portal login
    │   ├── CustomerHomeScreen.tsx     # Customer landing & profile
    │   └── MerchantHomeScreen.tsx     # Merchant landing & linked shop card
    ├── services/              # Infrastructure services
    │   ├── storageService.ts  # SecureStore & AsyncStorage adapter
    │   └── errorHandler.ts    # NearMart API error code parser
    ├── store/                 # State management
    │   └── AuthContext.tsx    # User, token, role, login, logout, language
    ├── types/                 # TypeScript interfaces
    │   ├── api.ts             # ApiResponse<T>, ApiError, Pagination
    │   └── auth.ts            # UserProfile, ShopSummary, Login/Register DTOs
    └── utils/                 # Utilities & constants
        ├── theme.ts           # Palette, typography, spacing, shadows
        └── validators.ts      # Email, phone, password validators
```

---

## 3. Key Capabilities

### 3.1 Multi-Role Authentication & Dynamic Routing
- **Unauthenticated Flow**:
  1. **Splash Screen**: Checks saved Bearer token in secure storage.
  2. **Language Selection**: Choose between **English** and **മലയാളം**.
  3. **Welcome Screen**: Directs users toward Customer shopping or Merchant partner access.
  4. **Customer Auth**: Registration & Login with validation and duplicate detection.
  5. **Merchant Auth**: Dedicated partner sign-in connecting to linked store records.
- **Role-Based Routing**:
  - `customer`: Automatically routed to `CustomerNavigator`.
  - `merchant` / `administrator`: Automatically routed to `MerchantNavigator`.

### 3.2 Bilingual Localization (English & Malayalam)
- Full support for English and Malayalam (`ml`).
- Dynamic runtime language switching without restarting the app.
- Automatically appends active language parameter (`?lang=en` or `?lang=ml`) to all backend REST API requests.

### 3.3 Platform-Resilient Token Storage
- Uses `expo-secure-store` on iOS and Android for cryptographic token security.
- Gracefully falls back to `AsyncStorage` on web or unsupported platforms.

---

## 4. Getting Started

### Prerequisites
- Node.js (v18+)
- Local WordPress development server running at `http://nearmart.local`

### Installation & Execution
```bash
# Navigate to project folder
cd "E:\ai projects\nearmart"

# Install dependencies
npm install

# Start development server
npm start

# Run on Android Emulator or Device
npm run android

# Run on iOS Simulator
npm run ios

# Run in Web Browser
npm run web
```