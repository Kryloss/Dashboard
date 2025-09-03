"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-2 overflow-hidden rounded-[14px] border p-3 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "bg-[#121318] border-[#212227] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),_0_1px_2px_rgba(0,0,0,0.60)]",
        success: "bg-[#121318] border-[#22C55E] shadow-[0_0_0_1px_rgba(34,197,94,0.35),_0_8px_40px_rgba(34,197,94,0.20)]",
        info: "bg-[#121318] border-[#2A8CEA] shadow-[0_0_0_1px_rgba(42,140,234,0.35),_0_8px_40px_rgba(42,140,234,0.20)]",
        warning: "bg-[#121318] border-[#F59E0B] shadow-[0_0_0_1px_rgba(245,158,11,0.35),_0_8px_40px_rgba(245,158,11,0.20)]",
        destructive: "bg-[#121318] border-[#EF4444] shadow-[0_0_0_1px_rgba(239,68,68,0.35),_0_8px_40px_rgba(239,68,68,0.20)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const ToastProvider = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "fixed bottom-6 left-6 z-[100] flex max-h-screen w-full flex-col-reverse space-y-2 space-y-reverse sm:bottom-6 sm:left-6 sm:max-w-[420px] sm:space-y-4",
      className
    )}
    {...props}
  />
))
ToastProvider.displayName = "ToastProvider"

const ToastViewport = React.forwardRef<
  React.ElementRef<"ol">,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    tabIndex={-1}
    className={cn(
      "fixed bottom-6 right-6 z-[100] flex max-h-screen w-full flex-col-reverse space-y-2 space-y-reverse outline-none sm:max-w-[280px] sm:space-y-4",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = "ToastViewport"

const Toast = React.forwardRef<
  React.ElementRef<"li">,
  React.ComponentPropsWithoutRef<"li"> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = "Toast"

const ToastAction = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-transparent px-3 text-sm font-medium text-[#2A8CEA] hover:bg-[rgba(42,140,234,0.10)] hover:text-[#6EA1DB] focus:outline-none focus:ring-2 focus:ring-[#2A8CEA]",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentPropsWithoutRef<typeof Button>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      "absolute right-1 top-1 rounded-full p-1 text-[#A1A1AA] opacity-0 transition-opacity hover:text-[#F3F4F6] focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    variant="ghost"
    size="icon"
    {...props}
  >
    <X className="h-4 w-4" />
  </Button>
))
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold text-[#F3F4F6]", className)}
    {...props}
  />
))
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-[#A1A1AA]", className)}
    {...props}
  />
))
ToastDescription.displayName = "ToastDescription"

const ToastIcon = ({ variant }: { variant?: VariantProps<typeof toastVariants>["variant"] }) => {
  const iconClass = "h-6 w-6 shrink-0"
  
  switch (variant) {
    case "success":
      return <CheckCircle className={cn(iconClass, "text-[#22C55E]")} />
    case "info":
      return <Info className={cn(iconClass, "text-[#2A8CEA]")} />
    case "warning":
      return <AlertTriangle className={cn(iconClass, "text-[#F59E0B]")} />
    case "destructive":
      return <AlertCircle className={cn(iconClass, "text-[#EF4444]")} />
    default:
      return <Info className={cn(iconClass, "text-[#A1A1AA]")} />
  }
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
  toastVariants,
  type VariantProps,
}