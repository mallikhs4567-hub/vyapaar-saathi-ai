import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  events: ('INSERT' | 'UPDATE' | 'DELETE')[];
  throttleMs?: number;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
}

interface CreditSaverConfig {
  enabled: boolean;
  autoUnsubscribeOn: ('user_offline' | 'tab_inactive' | 'no_changes_5min')[];
  autoResumeOn: ('user_active' | 'tab_focus' | 'manual_refresh')[];
}

export const useRealtimeSubscription = (
  options: UseRealtimeSubscriptionOptions,
  creditSaver: CreditSaverConfig = {
    enabled: true,
    autoUnsubscribeOn: ['tab_inactive', 'no_changes_5min'],
    autoResumeOn: ['tab_focus', 'manual_refresh']
  }
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lastChangeRef = useRef<number>(Date.now());
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePayload = (event: string, payload: any) => {
    lastChangeRef.current = Date.now();
    
    // Reset inactivity timer
    if (creditSaver.enabled && creditSaver.autoUnsubscribeOn.includes('no_changes_5min')) {
      clearTimeout(inactivityTimerRef.current!);
      inactivityTimerRef.current = setTimeout(() => {
        unsubscribe();
      }, 5 * 60 * 1000); // 5 minutes
    }

    // Throttle handling
    if (options.throttleMs && throttleTimerRef.current) {
      return;
    }

    if (options.throttleMs) {
      throttleTimerRef.current = setTimeout(() => {
        throttleTimerRef.current = null;
      }, options.throttleMs);
    }

    // Call appropriate handler
    if (event === 'INSERT' && options.onInsert) {
      options.onInsert(payload);
    } else if (event === 'UPDATE' && options.onUpdate) {
      options.onUpdate(payload);
    } else if (event === 'DELETE' && options.onDelete) {
      options.onDelete(payload);
    }
  };

  const subscribe = () => {
    if (channelRef.current || isSubscribed) return;

    const channelName = `${options.table}-changes-${Date.now()}`;
    const channel = supabase.channel(channelName);

    options.events.forEach(event => {
      const config: any = {
        event,
        schema: 'public',
        table: options.table,
      };
      
      if (options.filter) {
        config.filter = options.filter;
      }

      channel.on(
        'postgres_changes' as any,
        config,
        (payload: any) => handlePayload(event, payload)
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsSubscribed(true);
        console.log(`✅ Subscribed to ${options.table} real-time updates`);
      }
    });

    channelRef.current = channel;

    // Set up inactivity timer
    if (creditSaver.enabled && creditSaver.autoUnsubscribeOn.includes('no_changes_5min')) {
      inactivityTimerRef.current = setTimeout(() => {
        unsubscribe();
      }, 5 * 60 * 1000);
    }
  };

  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsSubscribed(false);
      console.log(`❌ Unsubscribed from ${options.table} real-time updates`);
    }
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  };

  useEffect(() => {
    if (!creditSaver.enabled) {
      subscribe();
      return () => unsubscribe();
    }

    // Credit saver: Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden && creditSaver.autoUnsubscribeOn.includes('tab_inactive')) {
        unsubscribe();
      } else if (!document.hidden && creditSaver.autoResumeOn.includes('tab_focus')) {
        subscribe();
      }
    };

    // Credit saver: Handle online/offline
    const handleOnline = () => {
      if (creditSaver.autoResumeOn.includes('user_active')) {
        subscribe();
      }
    };

    const handleOffline = () => {
      if (creditSaver.autoUnsubscribeOn.includes('user_offline')) {
        unsubscribe();
      }
    };

    // Initial subscription
    if (!document.hidden) {
      subscribe();
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [options.table, creditSaver.enabled]);

  return {
    isSubscribed,
    subscribe,
    unsubscribe
  };
};