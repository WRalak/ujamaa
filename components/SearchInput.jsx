import React, { useState, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

const SearchInput = ({
  placeholder = 'Search...',
  value,
  onChange,
  onClear,
  debounceMs = 300,
  className = '',
  showClearButton = true,
  autoFocus = false
}) => {
  const [localValue, setLocalValue] = useState(value || '')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const debouncedValue = useDebounce(localValue, debounceMs)

  useEffect(() => {
    if (onChange && debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    setLocalValue(e.target.value)
  }

  const handleClear = () => {
    setLocalValue('')
    if (onClear) onClear()
    if (onChange) onChange('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear()
    }
  }

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-4 w-4 transition-colors ${
          isFocused ? 'text-green-600' : 'text-gray-400'
        }`} />
      </div>
      
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
          transition-all duration-200
          ${isFocused ? 'border-green-500 shadow-sm' : ''}
          ${className}
        `}
      />
      
      {showClearButton && localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
