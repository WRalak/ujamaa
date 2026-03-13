import React, { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, X, Info } from 'lucide-react'

const Toast = ({
  type = 'info',
  message,
  duration = 5000,
  onClose,
  showCloseButton = true,
  position = 'top-right'
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  const textColors = {
    success: 'text-green-800',
    error: 'text-red-800',
    warning: 'text-yellow-800',
    info: 'text-blue-800'
  }

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
    'top-center': 'fixed top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'fixed bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <div
      className={`
        ${positionClasses[position]}
        flex items-center p-4 mb-4 text-sm rounded-lg border shadow-lg
        ${bgColors[type]}
        animate-in slide-in-from-right duration-300
        max-w-md w-full
      `}
    >
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <div className={`ml-3 flex-1 ${textColors[type]}`}>
        <p className="font-medium">{message}</p>
      </div>
      {showCloseButton && (
        <button
          onClick={onClose}
          className={`ml-4 flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 ${textColors[type]}`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default Toast
