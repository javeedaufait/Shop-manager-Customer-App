import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let pendingRoute: { name: string; params?: any } | null = null;
let retryTimer: any = null;

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    try {
      navigationRef.navigate(name, params);
      pendingRoute = null;
      if (retryTimer) {
        clearInterval(retryTimer);
        retryTimer = null;
      }
      return;
    } catch (err) {
      // Container ready but screen not in active stack yet
      console.log('[Navigation] Navigate deferred, stack switching:', err);
    }
  }

  // Queue route for cold start or stack transition
  pendingRoute = { name, params };

  if (!retryTimer) {
    let attempts = 0;
    const maxAttempts = 15;

    retryTimer = setInterval(() => {
      attempts++;
      if (navigationRef.isReady() && pendingRoute) {
        try {
          navigationRef.navigate(pendingRoute.name, pendingRoute.params);
          pendingRoute = null;
          clearInterval(retryTimer);
          retryTimer = null;
          return;
        } catch {
          // Keep trying until stack completes mounting
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(retryTimer);
        retryTimer = null;
        pendingRoute = null;
      }
    }, 350);
  }
}
