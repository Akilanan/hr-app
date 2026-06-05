import { useEffect, useState } from 'react';

/** Live `prefers-reduced-motion` flag — used to skip all WebGL work entirely. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
}

/** True while the tab is backgrounded — lets the WebGL frameloop pause (no idle GPU burn). */
export function useVisibilityPause(): boolean {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  return hidden;
}

/** Cheap level-of-detail: scale particle density to the device's memory tier. */
export function deviceIntensity(base = 1): number {
  const mem =
    typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory : undefined;
  if (typeof mem === 'number') {
    if (mem <= 4) return base * 0.45;
    if (mem < 8) return base * 0.7;
  }
  return base;
}

/** N points scattered through a spherical volume — a starfield / nebula shell. */
export function sphericalPositions(count: number, radius: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius * (0.55 + Math.random() * 0.45);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}
