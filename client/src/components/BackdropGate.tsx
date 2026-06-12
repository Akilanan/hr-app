import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

/** Routes that paint their own full-bleed background (Landing / Login). */
const SELF_SCENE_ROUTES = new Set(['/', '/welcome', '/login']);

/**
 * Ambient backdrop for the APP shell in dark mode: a static, GPU-cheap CSS wash
 * (.fx-nebula) painted once into a fixed compositor layer — no per-frame work,
 * so data-dense screens stay smooth on high-DPI displays. Reacts live to theme
 * toggles via a data-theme MutationObserver.
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
