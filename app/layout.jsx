import { Toaster } from 'react-hot-toast'
import StoreProvider from './StoreProvider'
import { CurrencyProvider } from '@/contexts/CurrencyContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Chatbot from '@/components/Chatbot'
import './globals.css'

export const metadata = {
  title: 'SokoMtaani - Your Trusted East African Marketplace',
  description: 'Shop quality products from local East African sellers. Fast delivery across Kenya, Tanzania, Uganda, Rwanda, and Burundi.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white dark:bg-gray-900 flex flex-col transition-colors duration-200">
        <StoreProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <Navbar />
              <main className="flex-1 min-h-screen">
                {children}
              </main>
              <Footer />
              <Chatbot />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 3000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </CurrencyProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}