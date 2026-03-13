import React from 'react'

const LoadingSpinner = ({ size = 'md', color = 'primary', text = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const colorClasses = {
    primary: 'border-green-600 border-t-transparent',
    secondary: 'border-gray-600 border-t-transparent',
    white: 'border-white border-t-transparent'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`
          animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]}
        `}
      />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  )
}

export default LoadingSpinner
