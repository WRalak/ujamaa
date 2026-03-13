'use client'
import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import CurrencyService from '@/lib/currency'

export default function CurrencySelector() {
  const [selectedCurrency, setSelectedCurrency] = useState('KES')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load saved currency preference
    const saved = localStorage.getItem('preferredCurrency')
    if (saved && CurrencyService.getCurrencyByCode(saved)) {
      setSelectedCurrency(saved)
    }
  }, [])

  const handleCurrencyChange = (currencyCode) => {
    setSelectedCurrency(currencyCode)
    localStorage.setItem('preferredCurrency', currencyCode)
    setIsOpen(false)
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('currencyChanged', { 
      detail: { currency: currencyCode } 
    }))
  }

  const currentCurrency = CurrencyService.getCurrencyByCode(selectedCurrency)
  const options = CurrencyService.getCurrencySelectorOptions()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <span>{CurrencyService.getCountryFlag(selectedCurrency)}</span>
        <span className="font-medium">{currentCurrency.symbol}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleCurrencyChange(option.value)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  selectedCurrency === option.value ? 'bg-green-50 text-green-700' : 'text-gray-700'
                }`}
              >
                <span>{option.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-medium">{option.label}</div>
                </div>
                {selectedCurrency === option.value && (
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-3">
            <p className="text-xs text-gray-500">
              Prices automatically converted to your preferred currency
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
