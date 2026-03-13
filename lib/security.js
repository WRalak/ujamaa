import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean'

class SecurityService {
  // Encryption/Decryption
  static encrypt(text, key = process.env.ENCRYPTION_KEY || 'default-key') {
    const algorithm = 'aes-256-cbc'
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv)
    
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    
    return iv.toString('hex') + ':' + encrypted.toString('hex')
  }

  static decrypt(text, key = process.env.ENCRYPTION_KEY || 'default-key') {
    const algorithm = 'aes-256-cbc'
    const textParts = text.split(':')
    const iv = Buffer.from(textParts.shift(), 'hex')
    const encryptedText = Buffer.from(textParts.join(':'), 'hex')
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv)
    
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString()
  }

  // Generate secure random tokens
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex')
  }

  // Hash sensitive data
  static async hashData(data) {
    const saltRounds = 12
    return await bcrypt.hash(data, saltRounds)
  }

  // Verify hashed data
  static async verifyHash(data, hash) {
    return await bcrypt.compare(data, hash)
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    return xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    })
  }

  // Sanitize MongoDB queries
  static sanitizeQuery(query) {
    return mongoSanitize(query)
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Validate phone number (East African format)
  static isValidPhoneNumber(phone, country = 'KE') {
    const phoneRegex = {
      'KE': /^(\+254|0)?[17]\d{8}$/,
      'TZ': /^(\+255|0)?[67]\d{8}$/,
      'UG': /^(\+256|0)?[37]\d{8}$/,
      'RW': /^(\+250|0)?[78]\d{8}$/,
      'BI': /^(\+257|0)?[67]\d{8}$/
    }
    
    return phoneRegex[country] ? phoneRegex[country].test(phone) : false
  }

  // Validate password strength
  static validatePassword(password) {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    
    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`)
    }
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!hasNumbers) {
      errors.push('Password must contain at least one number')
    }
    if (!hasSpecialChar) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Rate limiting configurations
  static getRateLimitConfig(type) {
    const configs = {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: 'Too many authentication attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
      },
      general: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // 100 requests per window
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false
      },
      strict: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 20, // 20 requests per window
        message: 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false
      },
      upload: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 uploads per hour
        message: 'Too many upload attempts, please try again later',
        standardHeaders: true,
        legacyHeaders: false
      }
    }

    return configs[type] || configs.general
  }

  // CSRF protection
  static generateCSRFToken() {
    return this.generateSecureToken(32)
  }

  static validateCSRFToken(token, sessionToken) {
    return token === sessionToken
  }

  // Input validation schemas
  static validationSchemas = {
    user: {
      name: {
        type: 'string',
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      },
      email: {
        type: 'string',
        required: true,
        format: 'email'
      },
      password: {
        type: 'string',
        required: true,
        minLength: 8,
        maxLength: 128
      }
    },
    product: {
      name: {
        type: 'string',
        required: true,
        minLength: 1,
        maxLength: 200
      },
      description: {
        type: 'string',
        required: true,
        minLength: 10,
        maxLength: 2000
      },
      price: {
        type: 'number',
        required: true,
        min: 0,
        max: 1000000
      },
      stock: {
        type: 'number',
        required: true,
        min: 0,
        max: 10000
      }
    },
    order: {
      shippingAddress: {
        street: { type: 'string', required: true },
        city: { type: 'string', required: true },
        state: { type: 'string', required: true },
        zipCode: { type: 'string', required: true },
        country: { type: 'string', required: true }
      }
    }
  }

  // Validate input against schema
  static validateInput(data, schema) {
    const errors = []
    const schemaRules = this.validationSchemas[schema]

    if (!schemaRules) {
      throw new Error('Invalid schema')
    }

    for (const [field, rules] of Object.entries(schemaRules)) {
      const value = data[field]

      // Required validation
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`)
        continue
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null || value === '') {
        continue
      }

      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`)
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters long`)
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`)
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`)
        }
      }

      // Number validations
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`)
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must not exceed ${rules.max}`)
        }
      }

      // Email validation
      if (rules.format === 'email' && !this.isValidEmail(value)) {
        errors.push(`${field} must be a valid email address`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Security headers configuration
  static getSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  }

  // Detect suspicious activity
  static detectSuspiciousActivity(activity) {
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /eval\s*\(/gi, // Eval functions
      /document\.cookie/gi, // Cookie access
      /localStorage/gi, // LocalStorage access
      /sessionStorage/gi, // SessionStorage access
    ]

    const combinedPattern = new RegExp(suspiciousPatterns.join('|'), 'gi')
    return combinedPattern.test(activity)
  }

  // Log security events
  static logSecurityEvent(event, details) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: this.getEventSeverity(event)
    }

    console.warn('SECURITY EVENT:', JSON.stringify(logEntry, null, 2))

    // TODO: Send to security monitoring service
    // SecurityMonitoringService.logEvent(logEntry)
  }

  static getEventSeverity(event) {
    const severityMap = {
      'login_attempt': 'low',
      'login_success': 'low',
      'login_failure': 'medium',
      'rate_limit_exceeded': 'high',
      'suspicious_activity': 'high',
      'sql_injection_attempt': 'critical',
      'xss_attempt': 'critical',
      'csrf_attempt': 'high',
      'unauthorized_access': 'high',
      'data_breach': 'critical'
    }

    return severityMap[event] || 'medium'
  }

  // File upload security
  static validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSize = 5 * 1024 * 1024) {
    const errors = []

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`)
    }

    // Check file extension
    const allowedExtensions = allowedTypes.map(type => type.split('/')[1])
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File extension .${fileExtension} is not allowed`)
    }

    // Scan for malicious content in filename
    if (this.detectSuspiciousActivity(file.name)) {
      errors.push('Filename contains suspicious content')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // API key validation
  static validateApiKey(apiKey, expectedKey) {
    if (!apiKey || !expectedKey) {
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(apiKey),
      Buffer.from(expectedKey)
    )
  }

  // Generate secure session ID
  static generateSessionId() {
    return this.generateSecureToken(64)
  }

  // Check for common passwords
  static isCommonPassword(password) {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ]

    return commonPasswords.includes(password.toLowerCase())
  }
}

export default SecurityService
