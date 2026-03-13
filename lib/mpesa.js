import axios from 'axios'

class MpesaService {
  constructor() {
    this.consumerKey = process.env.MPESA_CONSUMER_KEY
    this.consumerSecret = process.env.MPESA_CONSUMER_SECRET
    this.passkey = process.env.MPESA_PASSKEY
    this.shortcode = process.env.MPESA_SHORTCODE
    this.environment = process.env.MPESA_ENVIRONMENT || 'sandbox'
    
    this.baseURL = this.environment === 'production' 
      ? 'https://api.safaricom.co.ke' 
      : 'https://sandbox.safaricom.co.ke'
    
    this.accessToken = null
    this.tokenExpiry = null
  }

  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64')
      
      const response = await axios.get(
        `${this.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      )

      this.accessToken = response.data.access_token
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 5000 // Refresh 5s before expiry
      
      return this.accessToken
    } catch (error) {
      throw new Error('Failed to get M-Pesa access token')
    }
  }

  async initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
    try {
      const token = await this.getAccessToken()
      
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -3)
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64')
      
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: phoneNumber.replace(/^\+/, ''), // Remove + if present
        PartyB: this.shortcode,
        PhoneNumber: phoneNumber.replace(/^\+/, ''),
        CallBackURL: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/payments/mpesa/callback`,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc
      }

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      }
    }
  }

  async queryTransactionStatus(checkoutRequestID) {
    try {
      const token = await this.getAccessToken()
      
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -3)
      const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64')
      
      const payload = {
        BusinessShortCode: this.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      }

      const response = await axios.post(
        `${this.baseURL}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessage || error.message
      }
    }
  }

  // Format phone number for M-Pesa (ensure it starts with 254 for Kenya)
  formatPhoneNumber(phone) {
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/\D/g, '')
    
    // If starts with 0, replace with 254
    if (cleanPhone.startsWith('0')) {
      return '254' + cleanPhone.slice(1)
    }
    
    // If starts with 7 or 1, add 254
    if (cleanPhone.startsWith('7') || cleanPhone.startsWith('1')) {
      return '254' + cleanPhone
    }
    
    // If already has country code, return as is
    if (cleanPhone.startsWith('254')) {
      return cleanPhone
    }
    
    // Default case
    return cleanPhone
  }
}

export default new MpesaService()
