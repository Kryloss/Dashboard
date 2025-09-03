"use client"

import React from 'react'
import { useNotifications } from '@/lib/contexts/NotificationContext'
import { NotificationItem } from './NotificationItem'

export function NotificationContainer() {
  const { notifications } = useNotifications()

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <div className="flex flex-col-reverse space-y-2 space-y-reverse w-[280px]">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300 ease-out"
            style={{
              zIndex: 9999 - index,
              animationDelay: `${index * 50}ms`
            }}
          >
            <NotificationItem notification={notification} />
          </div>
        ))}
      </div>
    </div>
  )
}