import { useState, useEffect, useCallback } from 'react'

export function useChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMessage('bot', '👋 Karibu SokoMtaani! I\'m here to help you find amazing products from East African sellers. How can I assist you today?')
    }
  }, [])

  const addMessage = useCallback((sender, content) => {
    const newMessage = {
      sender,
      content,
      timestamp: new Date(),
      id: Date.now() + Math.random()
    }
    
    setMessages(prev => [...prev, newMessage])
    
    // Update unread count if chat is closed and message is from bot
    if (!isOpen && sender === 'bot') {
      setUnreadCount(prev => prev + 1)
    }
  }, [isOpen])

  const sendMessage = useCallback(async (userMessage) => {
    if (userMessage.trim() === '') return

    addMessage('user', userMessage)
    setIsTyping(true)

    // Simulate API call to chatbot service
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage)
      addMessage('bot', botResponse)
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }, [addMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
    setUnreadCount(0)
    addMessage('bot', '👋 Karibu SokoMtaani! How can I help you today?')
  }, [addMessage])

  const openChat = useCallback(() => {
    setIsOpen(true)
    setUnreadCount(0)
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleChat = useCallback(() => {
    if (isOpen) {
      closeChat()
    } else {
      openChat()
    }
  }, [isOpen, openChat, closeChat])

  // Generate bot response based on user input
  const generateBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase()
    
    // Product-related queries
    if (message.includes('product') || message.includes('find') || message.includes('search')) {
      return 'I can help you find products! You can browse our categories like Electronics, Clothing, Food, Agriculture, Beauty, Home & Garden, and more. What type of product are you looking for?'
    }
    
    // Payment queries
    if (message.includes('payment') || message.includes('pay') || message.includes('mpesa')) {
      return 'We accept M-Pesa, bank transfers, and other mobile money options across East Africa! M-Pesa is our most popular payment method - it\'s fast, secure, and available in Kenya, Tanzania, Uganda, Rwanda, and Burundi.'
    }
    
    // Shipping queries
    if (message.includes('shipping') || message.includes('delivery') || message.includes('ship')) {
      return 'We offer fast shipping across all East African countries! Delivery times vary by location:\n\n🇰🇪 Kenya: 1-3 days\n🇹🇿 Tanzania: 2-4 days\n🇺🇬 Uganda: 3-5 days\n🇷🇼 Rwanda: 3-5 days\n🇧🇮 Burundi: 4-6 days\n\nWould you like to know about shipping costs?'
    }
    
    // Seller queries
    if (message.includes('seller') || message.includes('sell') || message.includes('vendor')) {
      return 'Our sellers are verified businesses from across East Africa! Each seller goes through a verification process to ensure quality and trust. You can become a seller too - just register and complete your business verification!'
    }
    
    // Return/refund queries
    if (message.includes('return') || message.includes('refund') || message.includes('money back')) {
      return 'We have a customer-friendly return policy! Most items can be returned within 7 days if they\'re not as described. The process is simple - just contact us through your order page and we\'ll help you right away!'
    }
    
    // Account queries
    if (message.includes('account') || message.includes('register') || message.includes('sign up')) {
      return 'Creating an account is easy and free! Just click "Sign Up" at the top of the page. With an account, you can:\n\n• Track your orders\n• Save your favorites\n• Get personalized recommendations\n• Faster checkout\n• Earn loyalty points!'
    }
    
    // Currency queries
    if (message.includes('currency') || message.includes('price') || message.includes('kes') || message.includes('money')) {
      return 'We display prices in multiple East African currencies! You can switch between:\n\n🇰🇪 Kenyan Shilling (KES)\n🇹🇿 Tanzanian Shilling (TZS)\n🇺🇬 Ugandan Shilling (UGX)\n🇷🇼 Rwandan Franc (RWF)\n🇧🇮 Burundian Franc (BIF)\n\nJust use the currency selector at the top of any page!'
    }
    
    // Help/Support queries
    if (message.includes('help') || message.includes('support') || message.includes('contact')) {
      return 'I\'m here to help! You can also reach our support team:\n\n📧 Email: support@sokomtaani.co.ke\n📱 Phone: +254 700 123 456\n💬 Live Chat: Available 9am-6pm EAT\n\nWhat specific issue can I help you with?'
    }
    
    // Greetings
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('jambo')) {
      return 'Hello! 👋 Welcome to SokoMtaani! How can I help you discover amazing products from East African sellers today?'
    }
    
    // Thanks
    if (message.includes('thank') || message.includes('thanks') || message.includes('asante')) {
      return 'You\'re welcome! 😊 Is there anything else I can help you with? We have thousands of amazing products from local sellers!'
    }
    
    // Goodbye
    if (message.includes('bye') || message.includes('goodbye') || message.includes('exit')) {
      return 'Thanks for chatting with me! Feel free to come back anytime. Happy shopping at SokoMtaani! 🛍️'
    }
    
    // Default response
    return 'That\'s interesting! I can help you with:\n\n🔍 Finding products\n💳 Payment options\n🚚 Shipping information\n🏪 Seller information\n🔄 Returns & refunds\n👤 Account help\n💱 Currency questions\n\nWhat would you like to know more about?'
  }

  // Track chatbot interactions for analytics
  const trackInteraction = useCallback((action, data = {}) => {
    // This would integrate with your analytics system
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'chatbot_interaction', {
        action,
        ...data
      })
    }
  }, [])

  return {
    isOpen,
    messages,
    isTyping,
    unreadCount,
    sendMessage,
    clearMessages,
    openChat,
    closeChat,
    toggleChat,
    trackInteraction
  }
}
