// ============================================
// FILE: src/hooks/performance.ts
// All performance hooks in ONE file for easy copy-paste
// ============================================

import { useEffect, useState, useRef, useCallback } from 'react';

// ==================== DEBOUNCE ====================
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// ==================== THROTTLE ====================
export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

// ==================== API CACHE ====================
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, { data, timestamp: Date.now(), expiresIn });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const apiCache = new APICache();

// ==================== OPTIMIZED FETCH ====================
interface FetchOptions {
  cache?: boolean;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useOptimizedFetch<T>(
  url: string,
  options: FetchOptions = {}
): FetchState<T> {
  const {
    cache = true,
    cacheTime = 5 * 60 * 1000,
    retry = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async (attempt = 0): Promise<void> => {
    try {
      if (cache) {
        const cachedData = apiCache.get<T>(url);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();

      if (cache) apiCache.set(url, result, cacheTime);

      setData(result);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (attempt < retry) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return fetchData(attempt + 1);
      }
      
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [url, cache, cacheTime, retry, retryDelay]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    apiCache.delete(url);
    await fetchData();
  }, [url, fetchData]);

  return { data, loading, error, refetch };
}

// ==================== OPTIMISTIC UPDATE ====================
interface OptimisticUpdateOptions<T, P> {
  onMutate: (params: P) => T;
  onSuccess?: (data: T, params: P) => void;
  onError?: (error: Error, params: P, previousData: T) => void;
  mutationFn: (params: P) => Promise<T>;
}

export function useOptimisticUpdate<T, P>(
  initialData: T,
  options: OptimisticUpdateOptions<T, P>
) {
  const [data, setData] = useState<T>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (params: P) => {
    const previousData = data;
    
    try {
      const optimisticData = options.onMutate(params);
      setData(optimisticData);
      setIsLoading(true);
      setError(null);

      const result = await options.mutationFn(params);
      setData(result);
      
      if (options.onSuccess) options.onSuccess(result, params);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setData(previousData);
      setError(error);
      
      if (options.onError) options.onError(error, params, previousData);
    } finally {
      setIsLoading(false);
    }
  }, [data, options]);

  return { data, mutate, isLoading, error, setData };
}

// ==================== INFINITE SCROLL ====================
interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { threshold = 0.8, rootMargin = '100px' } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) callback();
      },
      { threshold, rootMargin }
    );

    const sentinel = sentinelRef.current;
    if (sentinel) observerRef.current.observe(sentinel);

    return () => {
      if (observerRef.current && sentinel) {
        observerRef.current.unobserve(sentinel);
      }
    };
  }, [callback, threshold, rootMargin]);

  return sentinelRef;
}

// ==================== REQUEST QUEUE ====================
interface QueuedRequest<T> {
  id: string;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  priority: number;
}

class RequestQueueManager {
  private queue: QueuedRequest<any>[] = [];
  private activeRequests = 0;
  private maxConcurrent: number;
  private requestDelay: number;

  constructor(maxConcurrent = 3, requestDelay = 100) {
    this.maxConcurrent = maxConcurrent;
    this.requestDelay = requestDelay;
  }

  async enqueue<T>(execute: () => Promise<T>, priority: number = 0): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: Math.random().toString(36).substr(2, 9),
        execute,
        resolve,
        reject,
        priority,
      };

      const insertIndex = this.queue.findIndex(r => r.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(request);
      } else {
        this.queue.splice(insertIndex, 0, request);
      }

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (!request) return;

    this.activeRequests++;

    try {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error as Error);
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  clear(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  getStatus() {
    return {
      pending: this.queue.length,
      active: this.activeRequests,
      total: this.queue.length + this.activeRequests,
    };
  }
}

export const requestQueue = new RequestQueueManager(3, 100);
