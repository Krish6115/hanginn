import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRoomSubscriptionsOptions {
  venueId: string;
  onSessionsChange: () => void;
  onRequestsChange: (payload: any) => void;
  onMessagesChange: () => void;
}

/**
 * Custom hook to manage Supabase Realtime subscriptions for a specific venue.
 * Ensures channels are properly scoped to the venueId to prevent collisions
 * and cleans up gracefully.
 */
export function useRoomSubscriptions({
  venueId,
  onSessionsChange,
  onRequestsChange,
  onMessagesChange,
}: UseRoomSubscriptionsOptions) {
  
  // Create stable references to callbacks
  const handleSessions = useCallback(() => {
    onSessionsChange();
  }, [onSessionsChange]);

  const handleRequests = useCallback((payload: any) => {
    onRequestsChange(payload);
  }, [onRequestsChange]);

  const handleMessages = useCallback(() => {
    onMessagesChange();
  }, [onMessagesChange]);

  useEffect(() => {
    if (!venueId) return;

    // Use venue-scoped channel names to prevent cross-room collision
    const sessionChannelName = `room-sessions-${venueId}`;
    const requestChannelName = `connection-requests-${venueId}`;
    const chatChannelName = `room-chat-${venueId}`;

    const sessionSub = supabase
      .channel(sessionChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_sessions', filter: `venue_id=eq.${venueId}` },
        handleSessions
      )
      .subscribe();

    const requestSub = supabase
      .channel(requestChannelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connection_requests', filter: `venue_id=eq.${venueId}` },
        handleRequests
      )
      .subscribe();

    const chatSub = supabase
      .channel(chatChannelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'room_messages', filter: `venue_id=eq.${venueId}` },
        handleMessages
      )
      .subscribe();

    return () => {
      // Clean up subscriptions when venueId changes or component unmounts
      supabase.removeChannel(sessionSub);
      supabase.removeChannel(requestSub);
      supabase.removeChannel(chatSub);
    };
  }, [venueId, handleSessions, handleRequests, handleMessages]);
}
