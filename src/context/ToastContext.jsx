import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './toastContextObject';

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    const toast = { id, message, type };

    setToasts((prevToasts) => [toast, ...prevToasts].slice(0, 5));

    window.setTimeout(() => {
      removeToast(id);
    }, 4200);
  }, [removeToast]);

  const value = useMemo(
    () => ({ toasts, addToast, removeToast }),
    [toasts, addToast, removeToast]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};
