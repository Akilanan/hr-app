import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import { ToastContext, type ToastFn, type ToastItem } from './useToast';

const ICON = { info: 'sparkle', success: 'check-circle', error: 'alert-triangle' } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback<ToastFn>(
    (message, type = 'info') => {
      const id = (idRef.current += 1);
      setToasts((t) => [...t, { id, message, type }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-wrap" aria-label="Notifications">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`} role={t.type === 'error' ? 'alert' : 'status'}>
            <Icon name={ICON[t.type]} size={16} />
            <span className="toast-msg">{t.message}</span>
            <button type="button" className="toast-x" aria-label="Dismiss notification" onClick={() => remove(t.id)}>
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
