"use client"

import { useState } from "react"
import { Plus, FileText, Dumbbell, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FABAction {
    label: string
    icon: React.ElementType
    onClick: () => void
    variant?: "primary" | "secondary"
}

interface MobileFABProps {
    actions: FABAction[]
}

export function MobileFAB({ actions }: MobileFABProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    if (actions.length === 0) return null

    // Single action - show directly
    if (actions.length === 1) {
        const action = actions[0]
        const Icon = action.icon
        return (
            <div className="md:hidden fixed bottom-20 right-4 z-40">
                <Button
                    onClick={action.onClick}
                    className="w-14 h-14 rounded-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white shadow-[0_8px_32px_rgba(42,140,234,0.35)] hover:shadow-[0_12px_40px_rgba(42,140,234,0.45)] hover:scale-105 active:scale-95 transition-all"
                >
                    <Icon className="w-6 h-6" />
                </Button>
            </div>
        )
    }

    // Multiple actions - show expandable menu
    return (
        <div className="md:hidden fixed bottom-20 right-4 z-40">
            {/* Backdrop */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            {/* Action buttons */}
            <div className="flex flex-col-reverse items-end gap-3 mb-3">
                {isExpanded &&
                    actions.map((action, index) => {
                        const Icon = action.icon
                        return (
                            <div
                                key={index}
                                className="flex items-center gap-3 animate-in slide-in-from-bottom-2 fade-in duration-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <span className="bg-[#121922] text-[#FBF7FA] text-sm font-medium px-3 py-2 rounded-lg shadow-lg border border-[#2A3442] whitespace-nowrap">
                                    {action.label}
                                </span>
                                <Button
                                    onClick={() => {
                                        action.onClick()
                                        setIsExpanded(false)
                                    }}
                                    className={cn(
                                        "w-12 h-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all",
                                        action.variant === "secondary"
                                            ? "bg-gradient-to-r from-[#6B7280] via-[#4B5563] to-[#374151] shadow-[0_4px_16px_rgba(107,114,128,0.25)]"
                                            : "bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] shadow-[0_4px_16px_rgba(42,140,234,0.25)]"
                                    )}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </Button>
                            </div>
                        )
                    })}
            </div>

            {/* Main FAB button */}
            <Button
                onClick={() => setIsExpanded(!isExpanded)}
                className={cn(
                    "w-14 h-14 rounded-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white shadow-[0_8px_32px_rgba(42,140,234,0.35)] hover:shadow-[0_12px_40px_rgba(42,140,234,0.45)] hover:scale-105 active:scale-95 transition-all",
                    isExpanded && "rotate-45"
                )}
            >
                {isExpanded ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </Button>
        </div>
    )
}
