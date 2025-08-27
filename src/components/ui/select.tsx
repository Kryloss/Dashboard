import * as React from "react"
import { cn } from "@/lib/utils"

// Simple native select implementation without Radix UI dependency
interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children?: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  )
}

interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children }) => {
  return (
    <div className={cn("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm", className)}>
      {children}
    </div>
  )
}

interface SelectValueProps {
  placeholder?: string
}

const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-muted-foreground">{placeholder}</span>
}

interface SelectContentProps {
  children?: React.ReactNode
  className?: string
}

const SelectContent: React.FC<SelectContentProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  className?: string
}

const SelectItem: React.FC<SelectItemProps> = ({ value, children, className }) => {
  return (
    <option value={value} className={className}>
      {children}
    </option>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}