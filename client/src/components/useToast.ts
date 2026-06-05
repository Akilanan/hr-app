import { createContext, useContext } from 'react';

export type ToastType = 'info' | 'success' | 'error';
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}
export type ToastFn = (message: string, type?: ToastType) => void;

export const ToastContext = createContext<ToastFn | null>(null);

/**
 * Lightweight app-wide notifications — a styled, accessible replacement for the
 * native, unstyled `window.alert()`. Lives in its own module (not Toast.tsx) so
 * that file can export only a component and stay Fast-Refresh compatible.
 *
 *   const toast = useToast();
 *   toast('Saved', 'success');  toast(apiError(e), 'error');
 */
export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
