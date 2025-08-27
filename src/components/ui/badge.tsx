import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[rgba(37,122,218,0.10)] border-[rgba(37,122,218,0.35)] text-[#4AA7FF]",
        secondary:
          "border-transparent bg-[#2A3442] text-[#9CA9B7]",
        destructive:
          "border-transparent bg-red-500/10 text-red-400 border-red-500/30",
        outline: "text-[#FBF7FA] border-[#2A3442]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }