'use client'
import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User } from 'lucide-react'
import Button from './Button'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Initialize with welcome message
    if (messages.length === 0) {
      addMessage('bot', '👋 Karibu SokoMtaani! I\'m here to help you find amazing products from East African sellers. How can I assist you today?')
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const addMessage = (sender, content) => {
    setMessages(prev => [...prev, { sender, content, timestamp: new Date() }])
  }

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

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return

    const userMessage = inputValue.trim()
    addMessage('user', userMessage)
    setInputValue('')
    setIsTyping(true)

    // Simulate bot thinking time
    setTimeout(() => {
      const botResponse = generateBotResponse(userMessage)
      addMessage('bot', botResponse)
      setIsTyping(false)
    }, 1000 + Math.random() * 1000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessage = (content) => {
    // Convert newlines to <br> and basic formatting
    return content
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          {line}
          {index < content.split('\n').length - 1 && <br />}
        </span>
      ))
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          variant="primary"
          size="lg"
          className="rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300"
          icon={MessageCircle}
        />
      </div>
    )
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80' : 'w-96'
    }`}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot size={20} />
            <div>
              <h3 className="font-semibold">SokoMtaani Assistant</h3>
              <p className="text-xs opacity-90">Always here to help!</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-green-800 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-green-800 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'bot' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-green-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{formatMessage(message.content)}</p>
                    <p className="text-xs mt-1 opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {message.sender === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-start space-x-2 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isTyping || inputValue.trim() === ''}
                  variant="primary"
                  size="sm"
                  icon={Send}
                  className="px-3"
                />
              </div>
              
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {['Find Products', 'Payment Info', 'Shipping', 'Help'].map((action) => (
                  <button
                    key={action}
                    onClick={() => setInputValue(action)}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Chatbot
