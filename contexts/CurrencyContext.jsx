'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import CurrencyService from '@/lib/currency'

const CurrencyContext = createContext()

export function CurrencyProvider({ children }) {
  const [selectedCurrency, setSelectedCurrency] = useState('KES')

  useEffect(() => {
    // Load saved currency preference
    const saved = localStorage.getItem('preferredCurrency')
    if (saved && CurrencyService.getCurrencyByCode(saved)) {
      setSelectedCurrency(saved)
    }

    // Listen for currency change events
    const handleCurrencyChange = (event) => {
      setSelectedCurrency(event.detail.currency)
    }

    window.addEventListener('currencyChanged', handleCurrencyChange)
    
    return () => {
      window.removeEventListener('currencyChanged', handleCurrencyChange)
    }
  }, [])

  const formatPrice = (amount, currency = null) => {
    const targetCurrency = currency || selectedCurrency
    return CurrencyService.format(amount, targetCurrency)
  }

  const convertPrice = (amount, fromCurrency = 'KES', toCurrency = null) => {
    const targetCurrency = toCurrency || selectedCurrency
    return CurrencyService.convert(amount, fromCurrency, targetCurrency)
  }

  const formatPriceWithSymbol = (amount, currency = null) => {
    const targetCurrency = currency || selectedCurrency
    return CurrencyService.formatSymbol(amount, targetCurrency)
  }

  const value = {
    selectedCurrency,
    setSelectedCurrency,
    formatPrice,
    convertPrice,
    formatPriceWithSymbol,
    getCurrencyInfo: () => CurrencyService.getCurrencyByCode(selectedCurrency),
    getSupportedCurrencies: () => CurrencyService.getSupportedCurrencies()
  }

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
