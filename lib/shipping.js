// East African shipping calculations and zones

const EAST_AFRICAN_COUNTRIES = {
  KE: { name: 'Kenya', code: 'KE', currency: 'KES', taxRate: 0.16 },
  TZ: { name: 'Tanzania', code: 'TZ', currency: 'TZS', taxRate: 0.18 },
  UG: { name: 'Uganda', code: 'UG', currency: 'UGX', taxRate: 0.18 },
  RW: { name: 'Rwanda', code: 'RW', currency: 'RWF', taxRate: 0.18 },
  BI: { name: 'Burundi', code: 'BI', currency: 'BIF', taxRate: 0.18 }
}

const SHIPPING_ZONES = {
  // Kenya zones
  'KE-Nairobi': { baseRate: 150, freeThreshold: 2000, estimatedDays: '1-2' },
  'KE-Central': { baseRate: 200, freeThreshold: 2500, estimatedDays: '2-3' },
  'KE-Coast': { baseRate: 250, freeThreshold: 3000, estimatedDays: '2-4' },
  'KE-Western': { baseRate: 300, freeThreshold: 3500, estimatedDays: '3-4' },
  'KE-Northern': { baseRate: 350, freeThreshold: 4000, estimatedDays: '3-5' },
  'KE-Rift Valley': { baseRate: 200, freeThreshold: 2500, estimatedDays: '2-3' },
  'KE-Eastern': { baseRate: 250, freeThreshold: 3000, estimatedDays: '2-4' },
  
  // Tanzania zones
  'TZ-Dar es Salaam': { baseRate: 800, freeThreshold: 15000, estimatedDays: '3-5' },
  'TZ-Arusha': { baseRate: 1200, freeThreshold: 20000, estimatedDays: '4-6' },
  'TZ-Mwanza': { baseRate: 1200, freeThreshold: 20000, estimatedDays: '4-6' },
  'TZ-Other': { baseRate: 1500, freeThreshold: 25000, estimatedDays: '5-7' },
  
  // Uganda zones
  'UG-Kampala': { baseRate: 1200, freeThreshold: 18000, estimatedDays: '3-5' },
  'UG-Central': { baseRate: 1500, freeThreshold: 22000, estimatedDays: '4-6' },
  'UG-Eastern': { baseRate: 1800, freeThreshold: 25000, estimatedDays: '5-7' },
  'UG-Western': { baseRate: 1800, freeThreshold: 25000, estimatedDays: '5-7' },
  'UG-Northern': { baseRate: 2000, freeThreshold: 28000, estimatedDays: '6-8' },
  
  // Rwanda zones
  'RW-Kigali': { baseRate: 1500, freeThreshold: 20000, estimatedDays: '3-5' },
  'RW-Northern': { baseRate: 2000, freeThreshold: 25000, estimatedDays: '4-6' },
  'RW-Southern': { baseRate: 2000, freeThreshold: 25000, estimatedDays: '4-6' },
  'RW-Eastern': { baseRate: 2000, freeThreshold: 25000, estimatedDays: '4-6' },
  'RW-Western': { baseRate: 2200, freeThreshold: 28000, estimatedDays: '5-7' },
  
  // Burundi zones
  'BJ-Bujumbura': { baseRate: 2000, freeThreshold: 25000, estimatedDays: '4-6' },
  'BJ-Other': { baseRate: 2500, freeThreshold: 30000, estimatedDays: '5-7' }
}

// County/Region mapping for Kenya
const KENYA_COUNTIES = {
  'Nairobi': 'KE-Nairobi',
  'Mombasa': 'KE-Coast',
  'Kwale': 'KE-Coast',
  'Kilifi': 'KE-Coast',
  'Tana River': 'KE-Coast',
  'Lamu': 'KE-Coast',
  'Taita-Taveta': 'KE-Coast',
  'Garissa': 'KE-Northern',
  'Wajir': 'KE-Northern',
  'Mandera': 'KE-Northern',
  'Marsabit': 'KE-Northern',
  'Isiolo': 'KE-Northern',
  'Meru': 'KE-Eastern',
  'Tharaka-Nithi': 'KE-Eastern',
  'Embu': 'KE-Eastern',
  'Kitui': 'KE-Eastern',
  'Machakos': 'KE-Eastern',
  'Makueni': 'KE-Eastern',
  'Kajiado': 'KE-Northern',
  'Kiambu': 'KE-Central',
  'Muranga': 'KE-Central',
  'Nyandarua': 'KE-Central',
  'Nyeri': 'KE-Central',
  'Kirinyaga': 'KE-Central',
  'Nyeri': 'KE-Central',
  'Nakuru': 'KE-Rift Valley',
  'Baringo': 'KE-Rift Valley',
  'Laikipia': 'KE-Rift Valley',
  'Narok': 'KE-Rift Valley',
  'Kajiado': 'KE-Rift Valley',
  'Kericho': 'KE-Rift Valley',
  'Bomet': 'KE-Rift Valley',
  'Kakamega': 'KE-Western',
  'Vihiga': 'KE-Western',
  'Bungoma': 'KE-Western',
  'Busia': 'KE-Western',
  'Siaya': 'KE-Western',
  'Kisumu': 'KE-Western',
  'Homa Bay': 'KE-Western',
  'Migori': 'KE-Western',
  'Kisii': 'KE-Western',
  'Nyamira': 'KE-Western',
  'Turkana': 'KE-Northern',
  'West Pokot': 'KE-Northern',
  'Samburu': 'KE-Northern',
  'Trans Nzoia': 'KE-Western',
  'Uasin Gishu': 'KE-Rift Valley',
  'Elgeyo Marakwet': 'KE-Rift Valley',
  'Nandi': 'KE-Rift Valley',
  'Baringo': 'KE-Rift Valley'
}

class ShippingService {
  static getCountryInfo(countryCode) {
    return EAST_AFRICAN_COUNTRIES[countryCode] || null
  }

  static getShippingZone(country, region, city) {
    if (country === 'KE') {
      // For Kenya, try to determine zone by county
      const zone = KENYA_COUNTIES[region] || KENYA_COUNTIES[city]
      if (zone) {
        return SHIPPING_ZONES[zone]
      }
    }
    
    // For other countries, check specific zones
    const zoneKey = `${country}-${city}` || `${country}-${region}` || `${country}-Other`
    return SHIPPING_ZONES[zoneKey] || SHIPPING_ZONES[`${country}-Other`]
  }

  static calculateShipping(country, region, city, orderValue) {
    const zone = this.getShippingZone(country, region, city)
    
    if (!zone) {
      return {
        shippingCost: 0,
        isFree: false,
        estimatedDays: '7-14',
        error: 'Shipping not available to this location'
      }
    }

    const isFree = orderValue >= zone.freeThreshold
    const shippingCost = isFree ? 0 : zone.baseRate

    return {
      shippingCost,
      isFree,
      estimatedDays: zone.estimatedDays,
      freeThreshold: zone.freeThreshold,
      amountNeededForFree: isFree ? 0 : zone.freeThreshold - orderValue
    }
  }

  static calculateTax(country, orderValue) {
    const countryInfo = this.getCountryInfo(country)
    if (!countryInfo) {
      return { taxAmount: 0, taxRate: 0 }
    }

    const taxAmount = orderValue * countryInfo.taxRate
    return {
      taxAmount,
      taxRate: countryInfo.taxRate,
      taxPercentage: countryInfo.taxRate * 100
    }
  }

  static calculateOrderTotals(orderValue, country, region, city) {
    const shipping = this.calculateShipping(country, region, city, orderValue)
    const tax = this.calculateTax(country, orderValue)

    const subtotal = orderValue
    const shippingCost = shipping.shippingCost
    const taxAmount = tax.taxAmount
    const total = subtotal + shippingCost + taxAmount

    return {
      subtotal,
      shipping: {
        cost: shippingCost,
        isFree: shipping.isFree,
        estimatedDays: shipping.estimatedDays,
        amountNeededForFree: shipping.amountNeededForFree,
        freeThreshold: shipping.freeThreshold
      },
      tax: {
        amount: taxAmount,
        rate: tax.taxRate,
        percentage: tax.taxPercentage
      },
      total
    }
  }

  static getSupportedCountries() {
    return Object.values(EAST_AFRICAN_COUNTRIES)
  }

  static getKenyaCounties() {
    return Object.keys(KENYA_COUNTIES)
  }

  static formatCurrency(amount, currency = 'KES') {
    const formatters = {
      'KES': { locale: 'en-KE', currency: 'KES' },
      'TZS': { locale: 'en-TZ', currency: 'TZS' },
      'UGX': { locale: 'en-UG', currency: 'UGX' },
      'RWF': { locale: 'en-RW', currency: 'RWF' },
      'BIF': { locale: 'en-BI', currency: 'BIF' }
    }

    const formatter = formatters[currency]
    if (formatter) {
      return new Intl.NumberFormat(formatter.locale, {
        style: 'currency',
        currency: formatter.currency,
        minimumFractionDigits: currency === 'UGX' || currency === 'RWF' || currency === 'BIF' ? 0 : 2
      }).format(amount)
    }

    // Fallback formatting
    return `${currency} ${amount.toLocaleString()}`
  }
}

export default ShippingService
