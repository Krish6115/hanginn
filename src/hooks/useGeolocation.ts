import { useState, useEffect, useRef, useCallback } from 'react';

export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

interface GeolocationState {
  /** Current latitude (null until first fix) */
  latitude: number | null;
  /** Current longitude (null until first fix) */
  longitude: number | null;
  /** GPS accuracy in meters (null until first fix) */
  accuracy: number | null;
  /** Whether the geolocation API is available */
  supported: boolean;
  /** Current permission state */
  permission: PermissionState;
  /** Whether we're actively trying to get a position */
  loading: boolean;
  /** Last error message */
  error: string | null;
}

interface UseGeolocationOptions {
  /** Whether to start watching immediately. Default: true */
  enabled?: boolean;
  /** Minimum time between position updates in ms. Default: 3000 */
  throttleMs?: number;
  /** Discard readings with accuracy worse than this (meters). Default: 60 */
  maxAccuracy?: number;
  /** Use high accuracy GPS. Default: true */
  highAccuracy?: boolean;
  /** Maximum age of cached position in ms. Default: 10000 */
  maximumAge?: number;
  /** Timeout for position request in ms. Default: 15000 */
  timeout?: number;
}

const DEFAULT_OPTIONS: Required<UseGeolocationOptions> = {
  enabled: true,
  throttleMs: 3000,
  maxAccuracy: 60,
  highAccuracy: true,
  maximumAge: 10000,
  timeout: 15000,
};

/**
 * Shared geolocation hook with battery-aware polling, jitter filtering,
 * and throttled updates.
 *
 * Designed to replace per-component `navigator.geolocation.watchPosition` calls
 * that were causing 10x GPS listener spam on the venue list page.
 */
export function useGeolocation(options?: UseGeolocationOptions): GeolocationState {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    supported: typeof navigator !== 'undefined' && 'geolocation' in navigator,
    permission: 'prompt',
    loading: false,
    error: null,
  });

  const lastUpdateRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  // Check permission state on mount
  useEffect(() => {
    if (!state.supported) {
      setState((s) => ({ ...s, permission: 'unavailable' }));
      return;
    }

    // The Permissions API is not universally available
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setState((s) => ({ ...s, permission: result.state as PermissionState }));

          // Listen for permission changes (e.g., user revokes in settings)
          result.addEventListener('change', () => {
            setState((s) => ({ ...s, permission: result.state as PermissionState }));
          });
        })
        .catch(() => {
          // Permissions API not supported for geolocation — stay on 'prompt'
        });
    }
  }, [state.supported]);

  // Start/stop watching
  useEffect(() => {
    if (!opts.enabled || !state.supported) return;

    setState((s) => ({ ...s, loading: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();

        // Throttle: skip updates that arrive too fast
        if (now - lastUpdateRef.current < opts.throttleMs) return;

        // Jitter filter: discard inaccurate readings
        if (position.coords.accuracy > opts.maxAccuracy) return;

        lastUpdateRef.current = now;

        setState((s) => ({
          ...s,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          permission: 'granted',
          loading: false,
          error: null,
        }));
      },
      (error) => {
        let permission: PermissionState = state.permission;
        let errorMsg: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            permission = 'denied';
            errorMsg = 'Location permission denied. Please enable GPS access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location signal is weak. Try moving near a window or open area.';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg = 'Unable to determine your location.';
        }

        setState((s) => ({
          ...s,
          permission,
          loading: false,
          error: errorMsg,
        }));
      },
      {
        enableHighAccuracy: opts.highAccuracy,
        maximumAge: opts.maximumAge,
        timeout: opts.timeout,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [opts.enabled, opts.highAccuracy, opts.maximumAge, opts.timeout, opts.throttleMs, opts.maxAccuracy, state.supported]);

  return state;
}

/**
 * Utility: calculate distance from the geolocation state to a target coordinate.
 * Returns null if no position is available.
 */
export function distanceTo(
  geo: GeolocationState,
  targetLat: number,
  targetLng: number,
): number | null {
  if (geo.latitude === null || geo.longitude === null) return null;
  return getDistanceMetersRaw(geo.latitude, geo.longitude, targetLat, targetLng);
}

/** Haversine formula — same as types.ts but co-located for hook independence */
function getDistanceMetersRaw(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Collects multiple GPS readings and returns the averaged best ones.
 * Used by the VerifyPresence page for more accurate verification.
 */
export async function collectAccurateReadings(
  readingCount = 5,
  maxAccuracy = 40,
): Promise<{ lat: number; lng: number } | { weak: true }> {
  const valid: { lat: number; lng: number; acc: number }[] = [];

  for (let i = 0; i < readingCount; i++) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      if (pos.coords.accuracy <= maxAccuracy) {
        valid.push({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
        });
      }
    } catch (e: any) {
      if (e?.code === 1) throw e; // Permission denied — bubble up
      // Timeout / unavailable — keep trying
    }
  }

  if (valid.length < 2) return { weak: true };

  const best = valid.sort((a, b) => a.acc - b.acc).slice(0, 3);
  const lat = best.reduce((s, r) => s + r.lat, 0) / best.length;
  const lng = best.reduce((s, r) => s + r.lng, 0) / best.length;
  return { lat, lng };
}
