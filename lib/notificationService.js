import nodemailer from 'nodemailer'

class NotificationService {
  // Email configuration
  static getEmailTransport() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
  }

  // Send email notification
  static async sendEmail({ to, subject, html, text }) {
    try {
      const transporter = this.getEmailTransport()
      
      const mailOptions = {
        from: process.env.FROM_EMAIL || process.env.SMTP_USER,
        to,
        subject,
        html,
        text
      }

      const result = await transporter.sendMail(mailOptions)
      console.log('Email sent successfully:', result.messageId)
      
      return { success: true, messageId: result.messageId }
    } catch (error) {
      console.error('Email sending error:', error)
      return { success: false, error: error.message }
    }
  }

  // Email templates
  static getEmailTemplate(type, data) {
    const templates = {
      welcome: {
        subject: 'Welcome to SokoMtaani - Your East African Marketplace',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to SokoMtaani!</h1>
              <p style="color: white; margin: 10px 0; font-size: 18px;">Your trusted East African marketplace</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-top: 0;">Hello ${data.name},</h2>
              <p style="color: #666; line-height: 1.6;">
                Thank you for joining SokoMtaani! We're excited to have you as part of our growing community of East African buyers and sellers.
              </p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">What's next?</h3>
                <ul style="color: #666; line-height: 1.8;">
                  <li>🛍️ Browse thousands of products from local sellers</li>
                  <li>💳 Pay securely with M-Pesa and other mobile money options</li>
                  <li>🚚 Enjoy fast delivery across East Africa</li>
                  <li>⭐ Share your experience with reviews</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/shop" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Start Shopping
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center; margin-top: 30px;">
                If you have any questions, reply to this email or contact us at support@sokomtaani.co.ke
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
              <p>&copy; 2025 SokoMtaani. Serving Kenya, Tanzania, Uganda, Rwanda & Burundi</p>
              <p>🇰🇪 🇹🇿 🇺🇬 🇷🇼 🇧🇮</p>
            </div>
          </div>
        `
      },
      
      orderConfirmation: {
        subject: `Order Confirmation #${data.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
              <p style="color: white; margin: 5px 0;">Order #${data.orderNumber}</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Thank you for your order, ${data.customerName}!</h2>
              <p style="color: #666;">Your order has been confirmed and is being processed.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Order Details</h3>
                <p><strong>Order Number:</strong> #${data.orderNumber}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> ${data.totalAmount}</p>
                <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Shipping Address</h3>
                <p>${data.shippingAddress.street}</p>
                <p>${data.shippingAddress.city}, ${data.shippingAddress.state}</p>
                <p>${data.shippingAddress.country}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL}/orders/${data.orderId}" 
                   style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Track Your Order
                </a>
              </div>
            </div>
          </div>
        `
      },
      
      paymentReceived: {
        subject: `Payment Received for Order #${data.orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Payment Received!</h1>
              <p style="color: white; margin: 5px 0;">Order #${data.orderNumber}</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Payment Confirmation</h2>
              <p style="color: #666;">We've successfully received your payment of ${data.amount}.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Payment Details</h3>
                <p><strong>Amount:</strong> ${data.amount}</p>
                <p><strong>Method:</strong> ${data.method}</p>
                <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <p style="color: #666;">Your order is now being processed for shipment. You'll receive another notification when it's on its way!</p>
            </div>
          </div>
        `
      },
      
      orderShipped: {
        subject: `Your Order #${data.orderNumber} Has Been Shipped!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">📦 Your Order Has Shipped!</h1>
              <p style="color: white; margin: 5px 0;">Order #${data.orderNumber}</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Great News!</h2>
              <p style="color: #666;">Your order has been shipped and is on its way to you.</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Shipping Details</h3>
                <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p><strong>Carrier:</strong> ${data.carrier}</p>
                <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.trackingUrl}" 
                   style="background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Track Package
                </a>
              </div>
            </div>
          </div>
        `
      },
      
      passwordReset: {
        subject: 'Reset Your SokoMtaani Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Reset Password</h1>
              <p style="color: white; margin: 5px 0;">Security Alert</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333;">Password Reset Request</h2>
              <p style="color: #666;">We received a request to reset your password. Click the button below to reset it.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.resetUrl}" 
                   style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                This link will expire in 1 hour. If you didn't request this, please ignore this email.
              </p>
            </div>
          </div>
        `
      }
    }

    return templates[type] || templates.welcome
  }

  // Send welcome email
  static async sendWelcomeEmail(user) {
    const template = this.getEmailTemplate('welcome', {
      name: user.name,
      email: user.email
    })

    return await this.sendEmail({
      to: user.email,
      ...template
    })
  }

  // Send order confirmation
  static async sendOrderConfirmation(order, customer) {
    const template = this.getEmailTemplate('orderConfirmation', {
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      customerName: customer.name,
      totalAmount: order.totalPrice,
      paymentMethod: order.paymentMethod,
      shippingAddress: order.shippingAddress,
      orderId: order._id
    })

    return await this.sendEmail({
      to: customer.email,
      ...template
    })
  }

  // Send payment confirmation
  static async sendPaymentConfirmation(order, payment) {
    const template = this.getEmailTemplate('paymentReceived', {
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      amount: order.totalPrice,
      method: order.paymentMethod,
      transactionId: payment.providerTransactionId
    })

    return await this.sendEmail({
      to: order.user.email,
      ...template
    })
  }

  // Send shipping notification
  static async sendShippingNotification(order, trackingInfo) {
    const template = this.getEmailTemplate('orderShipped', {
      orderNumber: order._id.toString().slice(-8).toUpperCase(),
      trackingNumber: trackingInfo.number,
      carrier: trackingInfo.carrier,
      estimatedDelivery: trackingInfo.estimatedDelivery,
      trackingUrl: trackingInfo.url
    })

    return await this.sendEmail({
      to: order.user.email,
      ...template
    })
  }

  // Send password reset email
  static async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${resetToken}`
    
    const template = this.getEmailTemplate('passwordReset', {
      resetUrl
    })

    return await this.sendEmail({
      to: user.email,
      ...template
    })
  }

  // Send custom notification
  static async sendCustomNotification({ to, subject, content, type = 'info' }) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">${subject}</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${content}
        </div>
      </div>
    `

    return await this.sendEmail({
      to,
      subject,
      html,
      text: content.replace(/<[^>]*>/g, '') // Strip HTML for text version
    })
  }

  // Send bulk notifications (for marketing, announcements, etc.)
  static async sendBulkNotification({ recipients, subject, content, type = 'info' }) {
    const results = []
    
    for (const recipient of recipients) {
      const result = await this.sendCustomNotification({
        to: recipient.email,
        subject,
        content: recipient.customContent || content,
        type
      })
      
      results.push({
        email: recipient.email,
        success: result.success,
        error: result.error
      })
    }

    return {
      total: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    }
  }

  // In-app notification (to be stored in database)
  static async createInAppNotification(userId, { title, message, type, actionUrl, metadata = {} }) {
    // This would store the notification in a database
    // For now, return the notification object
    return {
      id: Date.now().toString(),
      userId,
      title,
      message,
      type,
      actionUrl,
      metadata,
      createdAt: new Date(),
      read: false
    }
  }

  // Push notification (requires service worker setup)
  static async sendPushNotification(subscription, { title, message, icon, badge, data = {} }) {
    const payload = {
      notification: {
        title,
        message,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data
      }
    }

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${process.env.FCM_SERVER_KEY}`
        },
        body: JSON.stringify({
          to: subscription.endpoint,
          ...payload
        })
      })

      const result = await response.json()
      return { success: result.success === 1, result }
    } catch (error) {
      console.error('Push notification error:', error)
      return { success: false, error: error.message }
    }
  }
}

export default NotificationService
