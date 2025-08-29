"use client"

import { cn } from "@/lib/utils"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  change?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  period?: string
  className?: string
}

export function StatCard({
  icon,
  label,
  value,
  change,
  period = "vs last week",
  className
}: StatCardProps) {
  const getChangeColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-[#22C55E]'
      case 'down':
        return 'text-[#EF4444]'
      default:
        return 'text-[#A1A1AA]'
    }
  }

  const getChangeIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↑'
      case 'down':
        return '↓'
      default:
        return '→'
    }
  }

  return (
    <div className={cn(
      "bg-[#121318] border border-[#212227] rounded-[20px] p-5",
      "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
      "hover:border-[#2A2B31] hover:-translate-y-[1px] hover:shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)]",
      "transition-all duration-200 ease-out",
      className
    )}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6] text-sm">
          {icon}
        </div>
        <span className="text-sm font-medium text-[#A1A1AA]">{label}</span>
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-[#F3F4F6] mb-1">
          {value}
        </div>
      </div>

      {change && (
        <div className={cn(
          "flex items-center space-x-1 text-xs font-medium",
          getChangeColor(change.direction)
        )}>
          <span>{getChangeIcon(change.direction)}</span>
          <span>{change.value}</span>
          <span className="text-[#7A7F86]">{period}</span>
        </div>
      )}
    </div>
  )
}