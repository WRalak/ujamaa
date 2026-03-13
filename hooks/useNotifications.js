import { useState, useEffect, useCallback } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // Fetch notifications
  const fetchNotifications = useCallback(async (options = {}) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const params = new URLSearchParams(options)
      const response = await fetch(`/api/notifications?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.notifications?.filter(n => !n.read).length || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n._id === notificationId ? { ...n, read: true, readAt: new Date() } : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ markAllAsRead: true })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, readAt: new Date() }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n._id !== notificationId))
        if (notifications.find(n => n._id === notificationId && !n.read)) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }, [notifications])

  // Create notification (for admin use)
  const createNotification = useCallback(async (notificationData) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      })

      if (response.ok) {
        const data = await response.json()
        // Add to local state
        setNotifications(prev => [data.notification, ...prev])
        setUnreadCount(prev => prev + 1)
        return data.notification
      }
    } catch (error) {
      console.error('Failed to create notification:', error)
      throw error
    }
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.error('Notification permission error:', error)
        return false
      }
    }
    return false
  }, [])

  // Check notification permission
  const checkPermission = useCallback(() => {
    if ('Notification' in window) {
      return Notification.permission === 'granted'
    }
    return false
  }, [])

  // Show browser notification
  const showBrowserNotification = useCallback(({ title, message, icon, badge, onClick }) => {
    if (checkPermission()) {
      const notification = new Notification(title, {
        body: message,
        icon: icon || '/icon-192x192.png',
        badge: badge || '/badge-72x72.png',
        vibrate: [100, 50, 100],
        onclick: onClick
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
    return null
  }, [])

  // Initialize on mount
  useEffect(() => {
    fetchNotifications()
    
    // Set up polling for new notifications (every 30 seconds)
    const interval = setInterval(() => {
      fetchNotifications()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    requestPermission,
    checkPermission,
    showBrowserNotification
  }
}
