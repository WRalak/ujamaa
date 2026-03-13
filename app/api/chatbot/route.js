import { NextResponse } from 'next/server'
import { withSecurity, generalRateLimit } from '@/middleware/security'

// Chatbot responses for different categories
const chatbotResponses = {
  greetings: [
    '👋 Karibu SokoMtaani! How can I help you today?',
    'Hello! Welcome to SokoMtaani! What are you looking for?',
    'Hi there! I\'m here to help you find amazing East African products!'
  ],
  products: [
    'I can help you find products! You can browse categories like Electronics, Clothing, Food, Agriculture, Beauty, Home & Garden, and more. What type of product are you looking for?',
    'We have thousands of products from verified East African sellers! What category interests you most?',
    'Let me help you discover amazing products! Are you looking for something specific or just browsing?'
  ],
  payment: [
    'We accept M-Pesa, bank transfers, and other mobile money options across East Africa! M-Pesa is our most popular payment method - it\'s fast, secure, and available in Kenya, Tanzania, Uganda, Rwanda, and Burundi.',
    'Payment is easy and secure! M-Pesa works instantly, while bank transfers take 1-2 business days. All transactions are encrypted and protected.',
    '💳 Payment options: M-Pesa (instant), Bank Transfer (1-2 days), Mobile Money. All East African currencies supported!'
  ],
  shipping: [
    '🚚 We offer fast shipping across East Africa! Kenya: 1-3 days, Tanzania: 2-4 days, Uganda: 3-5 days, Rwanda: 3-5 days, Burundi: 4-6 days. Would you like shipping cost details?',
    'Shipping is reliable and affordable! We partner with trusted couriers in each country. Tracking is available for all orders.',
    'Fast delivery to your doorstep! We ship to all major cities and rural areas across East Africa.'
  ],
  sellers: [
    '🏪 Our sellers are verified businesses from across East Africa! Each seller goes through verification to ensure quality. You can become a seller too!',
    'All sellers are verified and rated by customers. We ensure quality and trust in every transaction.',
    'Join our seller community! Thousands of East African businesses are already selling on SokoMtaani.'
  ],
  returns: [
    '🔄 We have a customer-friendly return policy! Most items can be returned within 7 days if not as described. Just contact us through your order page.',
    'Your satisfaction is guaranteed! If you\'re not happy with your purchase, we\'ll help you return or exchange it.',
    'Easy returns and refunds! We stand behind the quality of products from our verified sellers.'
  ],
  account: [
    '👤 Creating an account is free and easy! With an account, you can track orders, save favorites, get recommendations, faster checkout, and earn loyalty points!',
    'Join our community! Account holders get exclusive deals and personalized recommendations.',
    'Sign up for a better shopping experience! Save time and get rewarded for your loyalty.'
  ],
  currency: [
    '💱 We display prices in all East African currencies! KES, TZS, UGX, RWF, BIF. Use the currency selector at the top of any page.',
    'Multi-currency support makes shopping easy! Prices automatically convert to your preferred currency.',
    'Shop in your local currency! We support Kenyan Shilling, Tanzanian Shilling, Ugandan Shilling, Rwandan Franc, and Burundian Franc.'
  ],
  help: [
    '📞 I\'m here to help! You can also reach our support team: Email: support@sokomtaani.co.ke, Phone: +254 700 123 456, Live Chat: 9am-6pm EAT',
    'Need assistance? Our support team is available via email, phone, and live chat. We\'re here to help!',
    'Customer support is our priority! Get help via multiple channels whenever you need it.'
  ],
  default: [
    'That\'s interesting! I can help you with: 🔍 Finding products, 💳 Payment options, 🚚 Shipping, 🏪 Seller info, 🔄 Returns, 👤 Account help, 💱 Currency questions. What interests you?',
    'I\'m here to assist! What would you like to know about SokoMtaani?',
    'How can I help you discover amazing products from East African sellers today?'
  ]
}

export async function POST(request) {
  return withSecurity(async (req) => {
    try {
      const { message, sessionId } = await request.json()

      if (!message) {
        return NextResponse.json(
          { error: 'Message is required' },
          { status: 400 }
        )
      }

      // Generate response based on message content
      const response = generateBotResponse(message)

      // Track the interaction for analytics
      // This would integrate with your analytics system
      console.log(`Chatbot interaction: ${message} -> ${response}`)

      return NextResponse.json({
        response,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Chatbot error:', error)
      return NextResponse.json(
        { error: 'Failed to process message' },
        { status: 500 }
      )
    }
  }, { rateLimitType: 'general' })()
}

function generateBotResponse(userMessage) {
  const message = userMessage.toLowerCase()
  
  // Check for specific keywords and return appropriate response
  if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('jambo') || message.includes('karibu')) {
    return getRandomResponse('greetings')
  }
  
  if (message.includes('product') || message.includes('find') || message.includes('search') || message.includes('looking') || message.includes('browse')) {
    return getRandomResponse('products')
  }
  
  if (message.includes('payment') || message.includes('pay') || message.includes('mpesa') || message.includes('money') || message.includes('transaction')) {
    return getRandomResponse('payment')
  }
  
  if (message.includes('shipping') || message.includes('delivery') || message.includes('ship') || message.includes('deliver') || message.includes('courier')) {
    return getRandomResponse('shipping')
  }
  
  if (message.includes('seller') || message.includes('sell') || message.includes('vendor') || message.includes('business') || message.includes('store')) {
    return getRandomResponse('sellers')
  }
  
  if (message.includes('return') || message.includes('refund') || message.includes('money back') || message.includes('exchange') || message.includes('satisfaction')) {
    return getRandomResponse('returns')
  }
  
  if (message.includes('account') || message.includes('register') || message.includes('sign up') || message.includes('login') || message.includes('profile')) {
    return getRandomResponse('account')
  }
  
  if (message.includes('currency') || message.includes('price') || message.includes('kes') || message.includes('tzs') || message.includes('ugx') || message.includes('rwf') || message.includes('bif')) {
    return getRandomResponse('currency')
  }
  
  if (message.includes('help') || message.includes('support') || message.includes('contact') || message.includes('assist') || message.includes('problem')) {
    return getRandomResponse('help')
  }
  
  if (message.includes('thank') || message.includes('thanks') || message.includes('asante') || message.includes('appreciate')) {
    return 'You\'re welcome! 😊 Is there anything else I can help you with? We have thousands of amazing products from local sellers!'
  }
  
  if (message.includes('bye') || message.includes('goodbye') || message.includes('exit') || message.includes('close')) {
    return 'Thanks for chatting with me! Feel free to come back anytime. Happy shopping at SokoMtaani! 🛍️'
  }
  
  // Default response
  return getRandomResponse('default')
}

function getRandomResponse(category) {
  const responses = chatbotResponses[category] || chatbotResponses.default
  return responses[Math.floor(Math.random() * responses.length)]
}
