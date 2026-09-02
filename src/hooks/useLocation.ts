import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';
import { UserLocationState } from '../types/shops';

export function useLocation() {
  const [location, setLocation] = useState<UserLocationState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize saved location on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await locationService.getSavedLocation();
        const hasPerm = await locationService.checkPermission();
        if (isMounted) {
          setPermissionGranted(hasPerm);
          if (saved) {
            setLocation(saved);
          }
        }
      } catch (err) {
        console.warn('Error loading initial location:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Request device permission and acquire GPS coordinates.
   */
  const requestCurrentLocation = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await locationService.getCurrentLocation();
      if (loc) {
        setLocation(loc);
        setPermissionGranted(true);
        setIsLoading(false);
        return true;
      } else {
        setPermissionGranted(false);
        setError('Location permission was denied or unavailable.');
        setIsLoading(false);
        return false;
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to determine location');
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Manually select an area when GPS is denied or preferred.
   */
  const selectArea = useCallback(async (areaName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await locationService.setManualArea(areaName);
      setLocation(loc);
    } catch (err: any) {
      setError(err?.message || 'Failed to set area');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    location,
    isLoading,
    permissionGranted,
    error,
    requestCurrentLocation,
    selectArea,
  };
}