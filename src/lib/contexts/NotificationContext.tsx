"use client"

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

export type NotificationVariant = 'default' | 'success' | 'info' | 'warning' | 'destructive'

export interface NotificationAction {
  label: string
  onClick: () => void
}

export interface Notification {
  id: string
  title: string
  description?: string
  variant: NotificationVariant
  duration?: number
  action?: NotificationAction
  dismissible?: boolean
  createdAt: number
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
  success: (title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => string
  info: (title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => string
  warning: (title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => string
  error: (title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => string
}

const NotificationContext = createContext<NotificationContextType | null>(null)

interface NotificationProviderProps {
  children: React.ReactNode
  maxNotifications?: number
  defaultDuration?: number
}

export function NotificationProvider({ 
  children, 
  maxNotifications = 5, 
  defaultDuration = 5000 
}: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
    
    // Clear the timeout for this notification
    const timeoutId = timeoutRefs.current.get(id)
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutRefs.current.delete(id)
    }
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    
    // Clear all timeouts
    timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
    timeoutRefs.current.clear()
  }, [])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36)
    const createdAt = Date.now()
    const duration = notification.duration ?? defaultDuration

    const newNotification: Notification = {
      ...notification,
      id,
      createdAt,
      dismissible: notification.dismissible ?? true
    }

    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      
      // Remove oldest notifications if we exceed the maximum
      if (updated.length > maxNotifications) {
        const removed = updated.slice(maxNotifications)
        removed.forEach(n => {
          const timeoutId = timeoutRefs.current.get(n.id)
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutRefs.current.delete(n.id)
          }
        })
        return updated.slice(0, maxNotifications)
      }
      
      return updated
    })

    // Set auto-dismiss timeout if duration is specified
    if (duration > 0) {
      const timeoutId = setTimeout(() => {
        removeNotification(id)
      }, duration)
      
      timeoutRefs.current.set(id, timeoutId)
    }

    return id
  }, [maxNotifications, defaultDuration, removeNotification])

  // Helper methods for different notification types
  const success = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => {
    return addNotification({ ...options, title, variant: 'success' })
  }, [addNotification])

  const info = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => {
    return addNotification({ ...options, title, variant: 'info' })
  }, [addNotification])

  const warning = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => {
    return addNotification({ ...options, title, variant: 'warning' })
  }, [addNotification])

  const error = useCallback((title: string, options?: Partial<Omit<Notification, 'id' | 'title' | 'variant' | 'createdAt'>>) => {
    return addNotification({ ...options, title, variant: 'destructive' })
  }, [addNotification])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutRefs.current.clear()
    }
  }, [])

  const contextValue: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    info,
    warning,
    error
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  
  return context
}

export { NotificationContext }