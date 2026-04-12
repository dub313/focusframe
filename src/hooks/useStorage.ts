import { useState, useEffect, useCallback, useRef } from 'react';
import { storageGet, storageSet } from '../lib/storage';

export function useStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    const stored = await storageGet<T>(key);
    if (mountedRef.current) {
      setData(stored ?? defaultValue);
      setLoading(false);
    }
  }, [key, defaultValue]);

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, [load]);

  const set = useCallback(async (value: T | ((prev: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      storageSet(key, next);
      return next;
    });
  }, [key]);

  return { data, loading, set, refresh: load };
}
