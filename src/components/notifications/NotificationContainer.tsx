"use client"

import React, { useState, useEffect } from 'react'
import { useNotifications } from '@/lib/contexts/NotificationContext'
import { NotificationItem } from './NotificationItem'

export function NotificationContainer() {
  const { notifications } = useNotifications()
  const [displayNotifications, setDisplayNotifications] = useState<typeof notifications>([])
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  // Handle notification transitions
  useEffect(() => {
    // Add new notifications immediately
    const newNotifications = notifications.filter(
      n => !displayNotifications.some(d => d.id === n.id)
    )
    
    if (newNotifications.length > 0) {
      setDisplayNotifications(prev => [...newNotifications, ...prev])
    }

    // Handle removals with exit animation
    const removedNotifications = displayNotifications.filter(
      d => !notifications.some(n => n.id === d.id) && !exitingIds.has(d.id)
    )

    if (removedNotifications.length > 0) {
      const idsToExit = new Set(removedNotifications.map(n => n.id))
      setExitingIds(prev => new Set([...prev, ...idsToExit]))

      // Remove from display after animation completes
      setTimeout(() => {
        setDisplayNotifications(prev => 
          prev.filter(n => !idsToExit.has(n.id))
        )
        setExitingIds(prev => {
          const newSet = new Set(prev)
          idsToExit.forEach(id => newSet.delete(id))
          return newSet
        })
      }, 300) // Match exit animation duration
    }
  }, [notifications, displayNotifications, exitingIds])

  return (
    <div className="fixed bottom-8 right-6 z-[9999] pointer-events-none">
      <div className="flex flex-col-reverse space-y-2 space-y-reverse w-[280px]">
        {displayNotifications.map((notification, index) => {
          const isExiting = exitingIds.has(notification.id)
          const isEntering = !isExiting
          
          return (
            <div
              key={notification.id}
              className={`pointer-events-auto ${
                isEntering ? 'notification-enter' : ''
              } ${isExiting ? 'notification-exit' : ''}`}
              style={{
                zIndex: 9999 - index,
                animationDelay: isEntering ? `${index * 50}ms` : '0ms'
              }}
            >
              <NotificationItem notification={notification} />
            </div>
          )
        })}
      </div>
    </div>
  )
}