import { useState, useEffect, useCallback, useRef } from 'react';
import { storageGet, storageSet } from '../lib/storage';

export function useStorage<T>(key: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const defaultRef = useRef(defaultValue);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    storageGet<T>(key).then((stored) => {
      if (!cancelled && mountedRef.current) {
        setData(stored ?? defaultRef.current);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [key]);

  const set = useCallback(async (value: T | ((prev: T) => T)) => {
    setData((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      storageSet(key, next);
      return next;
    });
  }, [key]);

  const refresh = useCallback(async () => {
    const stored = await storageGet<T>(key);
    if (mountedRef.current) {
      setData(stored ?? defaultRef.current);
    }
  }, [key]);

  return { data, loading, set, refresh };
}
