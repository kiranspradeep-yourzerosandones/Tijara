// src/hooks/useToast.js
import { useState, useCallback } from 'react';

const useToast = () => {
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((message, type = 'success', duration = 2500) => {
    setToast({ visible: true, message, type, duration });

    // Auto hide
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return { toast, showToast, hideToast };
};

export default useToast;