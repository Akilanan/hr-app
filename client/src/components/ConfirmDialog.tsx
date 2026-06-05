import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Modal } from './ui';
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './useConfirm';

/**
 * App-wide accessible confirm dialog — a promise-based replacement for the
 * native, unstyled `window.confirm()`. Reuses <Modal> (focus trap, Escape to
 * cancel, aria-modal, focus restore) with role="alertdialog". Escape / overlay /
 * Cancel all resolve false; only the explicit confirm button resolves true.
 *
 * Handles concurrent calls (cancels the previous) and resolves any pending
 * confirm as false on unmount so a promise never hangs.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    return new Promise<boolean>((resolve) => {
      // If a confirm is already open, cancel it before showing the next one.
      resolver.current?.(false);
      resolver.current = resolve;
      setOpts(o);
    });
  }, []);

  // Resolve a still-pending confirm as cancelled if the provider unmounts.
  useEffect(
    () => () => {
      resolver.current?.(false);
      resolver.current = null;
    },
    [],
  );

  // Stable so <Modal>'s keydown effect (deps: [open, onClose]) doesn't re-attach
  // on every parent re-render while the dialog is open.
  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  }, []);
  const handleCancel = useCallback(() => settle(false), [settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <Modal
          open
          role="alertdialog"
          title={opts.title}
          onClose={handleCancel}
          footer={
            <>
              <button type="button" className="btn" onClick={() => settle(false)}>
                {opts.cancelLabel ?? 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${opts.danger ? 'danger-solid' : 'primary'}`}
                onClick={() => settle(true)}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </button>
            </>
          }
        >
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {opts.message ?? 'Are you sure you want to continue?'}
          </div>
        </Modal>
      )}
    </ConfirmContext.Provider>
  );
}
