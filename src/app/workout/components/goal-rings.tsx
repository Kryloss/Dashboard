"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface GoalRingsProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    recoveryProgress: number    // 0-1 (sleep time + breaks)
    nutritionProgress: number   // 0-1 (calories + macros)
    exerciseProgress: number    // 0-1 (activities + plan extras)
    animated?: boolean
    className?: string
    centerContent?: {
        title: string
        value: string | number
        subtitle?: string
    }
    streak?: number // Consecutive days streak
}

const sizeConfig = {
    xs: {
        canvas: 160,
        thicknessOuter: 10,
        thicknessMiddle: 9,
        thicknessInner: 8,
        gap: 6,
        glowPadding: 32
    },
    sm: {
        canvas: 200,
        thicknessOuter: 12,
        thicknessMiddle: 11,
        thicknessInner: 10,
        gap: 7,
        glowPadding: 36
    },
    md: {
        canvas: 260,
        thicknessOuter: 14,
        thicknessMiddle: 12,
        thicknessInner: 11,
        gap: 8,
        glowPadding: 42
    },
    lg: {
        canvas: 320,
        thicknessOuter: 16,
        thicknessMiddle: 14,
        thicknessInner: 12,
        gap: 10,
        glowPadding: 48
    },
    xl: {
        canvas: 400,
        thicknessOuter: 20,
        thicknessMiddle: 18,
        thicknessInner: 16,
        gap: 12,
        glowPadding: 80
    }
}

const ringColors = {
    track: "rgba(255,255,255,0.06)",
    recovery: {
        start: "#2BD2FF",
        end: "#2A8CEA"
    },
    nutrition: {
        start: "#9BE15D",
        end: "#00E676"
    },
    exercise: {
        start: "#FF2D55",
        end: "#FF375F"
    }
}

export function GoalRings({
    size = 'md',
    recoveryProgress,
    nutritionProgress,
    exerciseProgress,
    animated = true,
    className,
    centerContent,
    streak
}: GoalRingsProps) {
    const svgRef = useRef<SVGSVGElement>(null)
    const config = sizeConfig[size]

    const outerRadius = (config.canvas - config.thicknessOuter) / 2
    const middleRadius = outerRadius - config.thicknessOuter - config.gap
    const innerRadius = middleRadius - config.thicknessMiddle - config.gap

    const getCircumference = (radius: number) => 2 * Math.PI * radius
    const getDashOffset = (progress: number, circumference: number) => {
        const clampedProgress = Math.max(0, Math.min(1, progress))
        return circumference * (1 - clampedProgress)
    }


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
    }, [animated, recoveryProgress, nutritionProgress, exerciseProgress])

    return (
        <div className={cn("relative", className)} style={{ padding: `${config.glowPadding}px` }}>
            {/* Glow effects */}
            {recoveryProgress >= 1 && (
                <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                        background: `radial-gradient(circle, rgba(43,210,255,0.3) 0%, rgba(42,140,234,0.2) 30%, transparent 70%)`,
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)'
                    }}
                />
            )}
            {nutritionProgress >= 1 && (
                <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                        background: `radial-gradient(circle, rgba(155,225,93,0.3) 0%, rgba(0,230,118,0.2) 30%, transparent 70%)`,
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)'
                    }}
                />
            )}
            {exerciseProgress >= 1 && (
                <div
                    className="absolute inset-0 rounded-full opacity-60"
                    style={{
                        background: `radial-gradient(circle, rgba(255,45,85,0.3) 0%, rgba(255,55,95,0.2) 30%, transparent 70%)`,
                        filter: 'blur(20px)',
                        transform: 'scale(1.1)'
                    }}
                />
            )}
            <svg
                ref={svgRef}
                width={config.canvas}
                height={config.canvas}
                className="drop-shadow-sm opacity-95 relative z-10"
                style={{
                    filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.05))'
                }}
                role="img"
                aria-label={`Recovery ${Math.round(recoveryProgress * 100)}%, Nutrition ${Math.round(nutritionProgress * 100)}%, Exercise ${Math.round(exerciseProgress * 100)}% complete`}
            >
                <defs>
                    <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.recovery.start} />
                        <stop offset="100%" stopColor={ringColors.recovery.end} />
                    </linearGradient>
                    <linearGradient id="nutritionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.start} />
                        <stop offset="100%" stopColor={ringColors.nutrition.end} />
                    </linearGradient>
                    <linearGradient id="exerciseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.exercise.start} />
                        <stop offset="100%" stopColor={ringColors.exercise.end} />
                    </linearGradient>
                </defs>

                {/* Recovery Ring (Outer) */}
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
                    stroke="url(#recoveryGradient)"
                    strokeWidth={config.thicknessOuter}
                    strokeLinecap="round"
                    strokeDasharray={outerCircumference}
                    strokeDashoffset={getDashOffset(recoveryProgress, outerCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                />

                {/* Nutrition Ring (Middle) */}
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
                    stroke="url(#nutritionGradient)"
                    strokeWidth={config.thicknessMiddle}
                    strokeLinecap="round"
                    strokeDasharray={middleCircumference}
                    strokeDashoffset={getDashOffset(nutritionProgress, middleCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                />

                {/* Exercise Ring (Inner) */}
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
                    stroke="url(#exerciseGradient)"
                    strokeWidth={config.thicknessInner}
                    strokeLinecap="round"
                    strokeDasharray={innerCircumference}
                    strokeDashoffset={getDashOffset(exerciseProgress, innerCircumference)}
                    transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                    className="progress-ring"
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    {streak !== undefined ? (
                        <>
                            <div className="text-xs font-medium text-[#A1A1AA] mb-1">
                                Streak
                            </div>
                            <div className="text-3xl font-bold text-[#F3F4F6] mb-1">
                                {streak}
                            </div>
                            <div className="text-xs text-[#7A7F86]">
                                {streak === 1 ? 'day' : 'days'}
                            </div>
                        </>
                    ) : centerContent ? (
                        <>
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
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    )
}