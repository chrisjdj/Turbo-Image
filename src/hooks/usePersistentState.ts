import { useEffect, useState } from 'react';

/** useState backed by localStorage. Storage failures (private mode, blocked storage) are ignored. */
export function usePersistentState<T>(key: string, initial: T, validate?: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw);
        if (!validate || validate(parsed)) return parsed as T;
      }
    } catch {
      /* ignore */
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  return [value, setValue] as const;
}
