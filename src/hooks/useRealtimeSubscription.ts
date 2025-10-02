import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  userId: string | undefined;
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  onDataChange: () => void;
  throttleMs?: number;
  enableCreditSaver?: boolean;
}

export const useRealtimeSubscription = ({
  table,
  userId,
  events,
  onDataChange,
  throttleMs = 1000,
  enableCreditSaver = true,
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  const handleDataChange = () => {
    if (throttleTimerRef.current) {
      pendingUpdateRef.current = true;
      return;
    }

    onDataChange();
    pendingUpdateRef.current = false;

    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      if (pendingUpdateRef.current) {
        onDataChange();
        pendingUpdateRef.current = false;
      }
    }, throttleMs);
  };

  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsSubscribed(false);
    }
  };

  const subscribe = () => {
    if (!userId || channelRef.current) return;

    const channel = supabase
      .channel(`${table}-changes-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          if (events.includes(eventType)) {
            console.log(`Real-time ${eventType} on ${table}:`, payload);
            handleDataChange();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
          console.log(`Subscribed to ${table} real-time updates`);
        }
      });

    channelRef.current = channel;
  };

  // Credit Saver: Handle visibility changes
  useEffect(() => {
    if (!enableCreditSaver) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        // Start inactivity timer (5 minutes)
        inactivityTimerRef.current = setTimeout(() => {
          console.log(`Auto-unsubscribing from ${table} due to inactivity`);
          unsubscribe();
        }, 5 * 60 * 1000);
      } else {
        isActiveRef.current = true;
        // Clear inactivity timer
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        // Resubscribe if not already subscribed
        if (!channelRef.current && userId) {
          console.log(`Auto-resuming subscription to ${table}`);
          subscribe();
          onDataChange(); // Refresh data
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableCreditSaver, userId, table]);

  // Initial subscription
  useEffect(() => {
    if (userId) {
      subscribe();
    }

    return () => {
      unsubscribe();
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [userId, table]);

  return { isSubscribed, subscribe, unsubscribe };
};
