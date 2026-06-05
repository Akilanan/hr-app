import { createContext, useContext, type ReactNode } from 'react';

export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm action as destructive (semantic danger color). */
  danger?: boolean;
}

export type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete?', danger: true }))) return;
 *
 * Lives in its own module (not ConfirmDialog.tsx) so that file can export only a
 * React component and stay Fast-Refresh compatible.
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx;
}
