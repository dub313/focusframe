import { useState, useCallback } from 'react';
import type { AnimationType, AnimationEvent } from '../types';

export function useAnimations() {
  const [queue, setQueue] = useState<AnimationEvent[]>([]);
  const [active, setActive] = useState<AnimationEvent | null>(null);

  const trigger = useCallback((type: AnimationType, data?: Record<string, unknown>) => {
    const event: AnimationEvent = {
      id: crypto.randomUUID(),
      type,
      data,
    };
    setQueue((prev) => [...prev, event]);
    setActive((current) => current ?? event);
  }, []);

  const dismiss = useCallback(() => {
    setQueue((prev) => {
      const next = prev.slice(1);
      setActive(next[0] ?? null);
      return next;
    });
  }, []);

  return { active, trigger, dismiss, hasAnimations: queue.length > 0 };
}
