import { useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Toast from '@/components/Toast'

const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, toast.duration || 5000)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((message, options = {}) => {
    addToast({ type: 'success', message, ...options })
  }, [addToast])

  const error = useCallback((message, options = {}) => {
    addToast({ type: 'error', message, ...options })
  }, [addToast])

  const warning = useCallback((message, options = {}) => {
    addToast({ type: 'warning', message, ...options })
  }, [addToast])

  const info = useCallback((message, options = {}) => {
    addToast({ type: 'info', message, ...options })
  }, [addToast])

  const ToastContainer = useCallback(() => {
    if (toasts.length === 0) return null

    return createPortal(
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>,
      document.body
    )
  }, [toasts, removeToast])

  return {
    success,
    error,
    warning,
    info,
    ToastContainer
  }
}

export default useToast
