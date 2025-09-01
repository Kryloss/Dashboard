"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface GoalRingsProps {
    size?: 'xs' | 'sm' | 'md' | 'lg'
    moveProgress: number    // 0-1 (calories)
    exerciseProgress: number // 0-1 (minutes)  
    standProgress: number   // 0-1 (hours)
    animated?: boolean
    className?: string
    centerContent?: {
        title: string
        value: string | number
        subtitle?: string
    }
}

const sizeConfig = {
    xs: {
        canvas: 160,
        thicknessOuter: 10,
        thicknessMiddle: 9,
        thicknessInner: 8,
        gap: 6
    },
    sm: {
        canvas: 200,
        thicknessOuter: 12,
        thicknessMiddle: 11,
        thicknessInner: 10,
        gap: 7
    },
    md: {
        canvas: 260,
        thicknessOuter: 14,
        thicknessMiddle: 12,
        thicknessInner: 11,
        gap: 8
    },
    lg: {
        canvas: 320,
        thicknessOuter: 16,
        thicknessMiddle: 14,
        thicknessInner: 12,
        gap: 10
    }
}

const ringColors = {
    track: "rgba(255,255,255,0.06)",
    move: {
        start: "#FF2D55",
        end: "#FF375F"
    },
    exercise: {
        start: "#9BE15D",
        end: "#00E676"
    },
    stand: {
        start: "#2BD2FF",
        end: "#2A8CEA"
    }
}

export function GoalRings({
    size = 'md',
    moveProgress,
    exerciseProgress,
    standProgress,
    animated = true,
    className,
    centerContent
}: GoalRingsProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const config = sizeConfig[size]

    const outerRadius = (config.canvas - config.thicknessOuter) / 2
    const middleRadius = outerRadius - config.thicknessOuter - config.gap
    const innerRadius = middleRadius - config.thicknessMiddle - config.gap

    const getCircumference = (radius: number) => 2 * Math.PI * radius
    const getDashOffset = (progress: number, circumference: number) =>
        circumference * (1 - Math.max(0, Math.min(1, progress)))

    const outerCircumference = getCircumference(outerRadius)
    const middleCircumference = getCircumference(middleRadius)
    const innerCircumference = getCircumference(innerRadius)

    useEffect(() => {
        if (animated && svgRef.current) {
            const rings = svgRef.current.querySelectorAll('.progress-ring')
            rings.forEach(ring => {
                (ring as HTMLElement).style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)'
            })
        }
    }, [animated, moveProgress, exerciseProgress, standProgress])

    return (
        <div className={cn("relative", className)}>
            <svg
                ref={svgRef}
                width={config.canvas}
                height={config.canvas}
                className="drop-shadow-sm opacity-95"
                style={{
                    filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.05))'
                }}
                role="img"
                aria-label={`Move ${Math.round(moveProgress * 100)}%, Exercise ${Math.round(exerciseProgress * 100)}%, Stand ${Math.round(standProgress * 100)}% complete`}
            >
                <defs>
                    <linearGradient id="moveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.move.start} />
                        <stop offset="100%" stopColor={ringColors.move.end} />
                    </linearGradient>
                    <linearGradient id="exerciseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.exercise.start} />
                        <stop offset="100%" stopColor={ringColors.exercise.end} />
                    </linearGradient>
                    <linearGradient id="standGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.stand.start} />
                        <stop offset="100%" stopColor={ringColors.stand.end} />
                    </linearGradient>
                </defs>

                {/* Move Ring (Outer) */}
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={outerRadius}
                    fill="none"
                    stroke={ringColors.track}
                    strokeWidth={config.thicknessOuter}
                    strokeLinecap="round"
                />
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={outerRadius}
                    fill="none"
                    stroke="url(#moveGradient)"
                    strokeWidth={config.thicknessOuter}
                    strokeLinecap="round"
                    strokeDasharray={outerCircumference}
                    strokeDashoffset={getDashOffset(moveProgress, outerCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                    style={moveProgress >= 1 ? {
                        filter: 'drop-shadow(0 0 12px rgba(255,45,85,0.6)) drop-shadow(0 0 24px rgba(255,55,95,0.4))'
                    } : undefined}
                />

                {/* Exercise Ring (Middle) */}
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={middleRadius}
                    fill="none"
                    stroke={ringColors.track}
                    strokeWidth={config.thicknessMiddle}
                    strokeLinecap="round"
                />
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={middleRadius}
                    fill="none"
                    stroke="url(#exerciseGradient)"
                    strokeWidth={config.thicknessMiddle}
                    strokeLinecap="round"
                    strokeDasharray={middleCircumference}
                    strokeDashoffset={getDashOffset(exerciseProgress, middleCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                    style={exerciseProgress >= 1 ? {
                        filter: 'drop-shadow(0 0 12px rgba(155,225,93,0.6)) drop-shadow(0 0 24px rgba(0,230,118,0.4))'
                    } : undefined}
                />

                {/* Stand Ring (Inner) */}
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={innerRadius}
                    fill="none"
                    stroke={ringColors.track}
                    strokeWidth={config.thicknessInner}
                    strokeLinecap="round"
                />
                <circle
                    cx={config.canvas / 2}
                    cy={config.canvas / 2}
                    r={innerRadius}
                    fill="none"
                    stroke="url(#standGradient)"
                    strokeWidth={config.thicknessInner}
                    strokeLinecap="round"
                    strokeDasharray={innerCircumference}
                    strokeDashoffset={getDashOffset(standProgress, innerCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                    style={standProgress >= 1 ? {
                        filter: 'drop-shadow(0 0 12px rgba(43,210,255,0.6)) drop-shadow(0 0 24px rgba(42,140,234,0.4))'
                    } : undefined}
                />
            </svg>

            {/* Center Content */}
            {centerContent && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-xs font-medium text-[#A1A1AA] mb-1">
                            {centerContent.title}
                        </div>
                        <div className="text-2xl font-bold text-[#F3F4F6]">
                            {centerContent.value}
                        </div>
                        {centerContent.subtitle && (
                            <div className="text-xs text-[#7A7F86] mt-1">
                                {centerContent.subtitle}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}