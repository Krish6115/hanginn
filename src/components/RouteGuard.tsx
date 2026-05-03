import { Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { useHanginnStore } from '@/lib/hanginnStore';

interface RouteGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
  requireVenue?: boolean;
  requireGeofence?: boolean;
}

/**
 * Ensures users follow the strict intended journey flow and cannot bypass
 * the geofence or missing profile setups by typing URLs directly.
 */
export function RouteGuard({
  children,
  requireProfile = false,
  requireVenue = false,
  requireGeofence = false,
}: RouteGuardProps) {
  const { currentProfile, getSessionState } = useHanginnStore();
  const location = useLocation();
  const { roomType } = useParams();
  const [searchParams] = useSearchParams();
  const venueId = searchParams.get('venue');

  // If a profile is required and missing, redirect to home
  if (requireProfile && !currentProfile) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If a venue is required (e.g., trying to join a room) and missing from query params
  if (requireVenue && !venueId) {
    return <Navigate to={`/rooms/${roomType || 'social'}`} replace />;
  }

  // If geofence verification is required (accessing live room or setting profile after verification)
  if (requireGeofence) {
    const session = getSessionState();
    
    // Check if geofence is verified for this specific venue
    const isVerified = session?.geofenceVerified && session?.venueId === venueId;

    if (!isVerified) {
      // Not verified? Send them back to the verify page
      const intent = searchParams.get('intent') || '';
      const vibe = searchParams.get('vibe') || '';
      return (
        <Navigate
          to={`/rooms/${roomType}/verify?venue=${venueId}&intent=${intent}&vibe=${vibe}`}
          replace
        />
      );
    }
  }

  return <>{children}</>;
}
