"use client"

import React, { useState, useEffect } from 'react'
import { Notification, useNotifications } from '@/lib/contexts/NotificationContext'
import { Toast, ToastIcon, ToastTitle, ToastDescription, ToastAction, ToastClose } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { removeNotification } = useNotifications()
  const [progress, setProgress] = useState(100)

  const { id, title, description, variant, duration = 5000, action, dismissible = true } = notification

  // Progress bar animation
  useEffect(() => {
    if (duration <= 0) return

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, duration - elapsed)
      const progressPercent = (remaining / duration) * 100

      setProgress(progressPercent)

      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 50) // Update every 50ms for smooth animation

    return () => clearInterval(interval)
  }, [duration])

  const handleClose = () => {
    removeNotification(id)
  }

  const handleActionClick = () => {
    if (action?.onClick) {
      action.onClick()
      removeNotification(id)
    }
  }

  return (
    <Toast
      variant={variant}
      className={cn(
        "relative overflow-hidden group",
        "bg-[#121318] backdrop-blur-sm",
        "border shadow-lg",
        // Variant-specific styling
        variant === 'success' && "border-[#22C55E]/50 shadow-[0_0_0_1px_rgba(34,197,94,0.25),_0_8px_32px_rgba(34,197,94,0.15)]",
        variant === 'info' && "border-[#2A8CEA]/50 shadow-[0_0_0_1px_rgba(42,140,234,0.25),_0_8px_32px_rgba(42,140,234,0.15)]",
        variant === 'warning' && "border-[#F59E0B]/50 shadow-[0_0_0_1px_rgba(245,158,11,0.25),_0_8px_32px_rgba(245,158,11,0.15)]",
        variant === 'destructive' && "border-[#EF4444]/50 shadow-[0_0_0_1px_rgba(239,68,68,0.25),_0_8px_32px_rgba(239,68,68,0.15)]",
        variant === 'default' && "border-[#212227] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]"
      )}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div
          className={cn(
            "absolute bottom-0 left-0 h-0.5 transition-all duration-75 ease-linear",
            variant === 'success' && "bg-[#22C55E]",
            variant === 'info' && "bg-[#2A8CEA]",
            variant === 'warning' && "bg-[#F59E0B]",
            variant === 'destructive' && "bg-[#EF4444]",
            variant === 'default' && "bg-[#A1A1AA]"
          )}
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="flex items-center space-x-2 w-full">
        {/* Icon */}
        <div className="flex-shrink-0">
          <ToastIcon variant={variant} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <ToastTitle className="font-medium text-[#F3F4F6] text-sm leading-tight truncate">
            {title}
          </ToastTitle>
          {description && (
            <ToastDescription className="text-xs text-[#A1A1AA] leading-tight truncate">
              {description}
            </ToastDescription>
          )}
        </div>

        {/* Action button - compact */}
        {action && (
          <ToastAction
            onClick={handleActionClick}
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-md transition-all flex-shrink-0",
              variant === 'success' && "text-[#22C55E] hover:bg-[rgba(34,197,94,0.10)]",
              variant === 'info' && "text-[#2A8CEA] hover:bg-[rgba(42,140,234,0.10)]",
              variant === 'warning' && "text-[#F59E0B] hover:bg-[rgba(245,158,11,0.10)]",
              variant === 'destructive' && "text-[#EF4444] hover:bg-[rgba(239,68,68,0.10)]",
              variant === 'default' && "text-[#A1A1AA] hover:bg-[rgba(161,161,170,0.10)]"
            )}
          >
            {action.label}
          </ToastAction>
        )}

        {/* Close button */}
        {dismissible && (
          <ToastClose
            onClick={handleClose}
            className="flex-shrink-0 rounded-full p-1 text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          />
        )}
      </div>
    </Toast>
  )
}