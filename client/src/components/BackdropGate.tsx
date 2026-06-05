import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Routes that render their own full WebGL hero scene (Landing / Login). */
const SELF_SCENE_ROUTES = new Set(['/', '/welcome', '/login']);

/**
 * Ambient backdrop for the APP shell in dark mode. Renders a STATIC, GPU-cheap CSS
 * nebula layer (no live WebGL canvas) so data-dense screens stay smooth on high-DPI
 * / 4K displays — a continuously-rendering full-screen canvas behind the app was the
 * root cause of navigation/scroll jank. The full Three.js particle universe lives on
 * the Landing/Login front door only. Reacts live to theme toggles.
 */
export function BackdropGate() {
  const { pathname } = useLocation();
  const [dark, setDark] = useState(() => document.documentElement.getAttribute('data-theme') === 'dark');

  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setDark(el.getAttribute('data-theme') === 'dark'));
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  if (!dark || SELF_SCENE_ROUTES.has(pathname)) return null;
  return <div className="fx-nebula" aria-hidden="true" />;
}
