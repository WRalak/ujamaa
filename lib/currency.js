// East African Currency Conversion System

const EAST_AFRICAN_CURRENCIES = {
  KES: { 
    name: 'Kenyan Shilling', 
    symbol: 'KES', 
    code: 'KES',
    rate: 1, // Base currency
    locale: 'en-KE',
    decimalPlaces: 2
  },
  TZS: { 
    name: 'Tanzanian Shilling', 
    symbol: 'TZS', 
    code: 'TZS',
    rate: 23.5, // 1 KES = 23.5 TZS (approximate)
    locale: 'en-TZ',
    decimalPlaces: 0
  },
  UGX: { 
    name: 'Ugandan Shilling', 
    symbol: 'UGX', 
    code: 'UGX',
    rate: 29.8, // 1 KES = 29.8 UGX (approximate)
    locale: 'en-UG',
    decimalPlaces: 0
  },
  RWF: { 
    name: 'Rwandan Franc', 
    symbol: 'RWF', 
    code: 'RWF',
    rate: 10.2, // 1 KES = 10.2 RWF (approximate)
    locale: 'en-RW',
    decimalPlaces: 0
  },
  BIF: { 
    name: 'Burundian Franc', 
    symbol: 'BIF', 
    code: 'BIF',
    rate: 18.5, // 1 KES = 18.5 BIF (approximate)
    locale: 'en-BI',
    decimalPlaces: 0
  }
}

class CurrencyService {
  static getSupportedCurrencies() {
    return Object.values(EAST_AFRICAN_CURRENCIES)
  }

  static getCurrencyByCode(code) {
    return EAST_AFRICAN_CURRENCIES[code] || EAST_AFRICAN_CURRENCIES.KES
  }

  static convert(amount, fromCurrency, toCurrency) {
    const from = this.getCurrencyByCode(fromCurrency)
    const to = this.getCurrencyByCode(toCurrency)
    
    // Convert to base currency (KES) first, then to target currency
    const baseAmount = amount / from.rate
    const convertedAmount = baseAmount * to.rate
    
    return convertedAmount
  }

  static format(amount, currencyCode = 'KES', locale = null) {
    const currency = this.getCurrencyByCode(currencyCode)
    const targetLocale = locale || currency.locale
    
    try {
      return new Intl.NumberFormat(targetLocale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces
      }).format(amount)
    } catch (error) {
      // Fallback formatting if Intl.NumberFormat fails
      const formattedAmount = amount.toLocaleString(undefined, {
        minimumFractionDigits: currency.decimalPrices,
        maximumFractionDigits: currency.decimalPlaces
      })
      return `${currency.symbol} ${formattedAmount}`
    }
  }

  static formatSymbol(amount, currencyCode = 'KES') {
    const currency = this.getCurrencyByCode(currencyCode)
    const formattedAmount = amount.toLocaleString(undefined, {
      minimumFractionDigits: currency.decimalPlaces,
      maximumFractionDigits: currency.decimalPlaces
    })
    return `${currency.symbol} ${formattedAmount}`
  }

  static detectUserCurrency(country) {
    const countryCurrencyMap = {
      'KE': 'KES',
      'TZ': 'TZS', 
      'UG': 'UGX',
      'RW': 'RWF',
      'BI': 'BIF'
    }
    
    return countryCurrencyMap[country] || 'KES'
  }

  static getExchangeRates() {
    const rates = {}
    Object.keys(EAST_AFRICAN_CURRENCIES).forEach(code => {
      rates[code] = EAST_AFRICAN_CURRENCIES[code].rate
    })
    return rates
  }

  // Calculate price in different currencies
  static calculatePrices(basePrice, baseCurrency = 'KES') {
    const prices = {}
    
    Object.keys(EAST_AFRICAN_CURRENCIES).forEach(currencyCode => {
      prices[currencyCode] = {
        amount: this.convert(basePrice, baseCurrency, currencyCode),
        formatted: this.format(this.convert(basePrice, baseCurrency, currencyCode), currencyCode),
        symbol: this.getCurrencyByCode(currencyCode).symbol
      }
    })
    
    return prices
  }

  // Get currency selector data
  static getCurrencySelectorOptions() {
    return Object.values(EAST_AFRICAN_CURRENCIES).map(currency => ({
      value: currency.code,
      label: `${currency.name} (${currency.symbol})`,
      symbol: currency.symbol,
      flag: this.getCountryFlag(currency.code)
    }))
  }

  static getCountryFlag(currencyCode) {
    const flagMap = {
      'KES': '🇰🇪',
      'TZS': '🇹🇿', 
      'UGX': '🇺🇬',
      'RWF': '🇷🇼',
      'BIF': '🇧🇮'
    }
    return flagMap[currencyCode] || '🇰🇪'
  }
}

export default CurrencyService
