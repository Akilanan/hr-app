import { useCallback, useEffect, useRef, useState } from 'react';
import { apiError } from '../api/client';

export function useFetch<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Monotonic id so out-of-order / superseded responses are ignored (prevents
  // a slow earlier request from overwriting the latest filter/page results).
  const callId = useRef(0);

  const reload = useCallback(() => {
    const id = ++callId.current;
    setLoading(true);
    return fn()
      .then((d) => {
        if (id !== callId.current) return;
        setData(d);
        setError(null);
      })
      .catch((e) => {
        if (id !== callId.current) return;
        setError(apiError(e));
      })
      .finally(() => {
        if (id === callId.current) setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    reload();
    // Invalidate any in-flight request when deps change or the component unmounts.
    return () => {
      callId.current++;
    };
  }, [reload]);

  return { data, loading, error, reload, setData, isInitialLoading: loading && data === null };
}
