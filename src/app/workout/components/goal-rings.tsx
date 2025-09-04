"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface GoalRingsProps {
    size?: 'xs' | 'sm' | 'md' | 'lg'
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
    // Subcategory segments
    recoverySegments?: {
        sleep: number      // 0-1
        breaks: number     // 0-1
    }
    nutritionSegments?: {
        carbs: number      // 0-1 (longest - green)
        protein: number    // 0-1 (shorter - green-blue gradient)
        fats: number       // 0-1 (shortest - green-yellow gradient)
        burned: number     // 0-1 (green-red gradient)
    }
    exerciseSegments?: {
        activities: number // 0-1
        extras: number     // 0-1
        cheating: number   // 0-1
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
    streak,
    recoverySegments,
    nutritionSegments,
    exerciseSegments
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

    // Helper function to render segmented ring
    const renderSegmentedRing = (
        radius: number,
        strokeWidth: number,
        segments: { [key: string]: number },
        gradients: { [key: string]: string },
        totalProgress: number
    ) => {
        const circumference = getCircumference(radius)
        const center = config.canvas / 2
        const sortedSegments = Object.entries(segments).sort(([,a], [,b]) => b - a) // Sort by progress descending
        
        return (
            <>
                {/* Track circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={ringColors.track}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                
                {/* Segment circles */}
                {sortedSegments.map(([key, progress], index) => {
                    const dashOffset = getDashOffset(progress, circumference)
                    return (
                        <circle
                            key={key}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={`url(#${gradients[key]})`}
                            strokeWidth={strokeWidth - index * 0.5} // Slightly reduce width for layering
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            transform={`rotate(-90 ${center} ${center})`}
                            className="progress-ring"
                            style={{
                                opacity: 0.9 - index * 0.1 // Slight opacity variation
                            }}
                        />
                    )
                })}
            </>
        )
    }

    useEffect(() => {
        if (animated && svgRef.current) {
            const rings = svgRef.current.querySelectorAll('.progress-ring')
            rings.forEach(ring => {
                (ring as HTMLElement).style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.22, 1, 0.36, 1)'
            })
        }
    }, [animated, recoveryProgress, nutritionProgress, exerciseProgress])

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
                aria-label={`Recovery ${Math.round(recoveryProgress * 100)}%, Nutrition ${Math.round(nutritionProgress * 100)}%, Exercise ${Math.round(exerciseProgress * 100)}% complete`}
            >
                <defs>
                    {/* Recovery gradients */}
                    <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.recovery.start} />
                        <stop offset="100%" stopColor={ringColors.recovery.end} />
                    </linearGradient>
                    <linearGradient id="recoverySleepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2BD2FF" />
                        <stop offset="100%" stopColor="#1E90FF" />
                    </linearGradient>
                    <linearGradient id="recoveryBreaksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4169E1" />
                        <stop offset="100%" stopColor="#2A8CEA" />
                    </linearGradient>

                    {/* Nutrition gradients */}
                    <linearGradient id="nutritionCarbsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#9BE15D" />
                        <stop offset="100%" stopColor="#00E676" />
                    </linearGradient>
                    <linearGradient id="nutritionProteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E676" />
                        <stop offset="100%" stopColor="#00BCD4" />
                    </linearGradient>
                    <linearGradient id="nutritionFatsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#9BE15D" />
                        <stop offset="100%" stopColor="#FFC107" />
                    </linearGradient>
                    <linearGradient id="nutritionBurnedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E676" />
                        <stop offset="100%" stopColor="#FF5722" />
                    </linearGradient>

                    {/* Exercise gradients */}
                    <linearGradient id="exerciseActivitiesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF2D55" />
                        <stop offset="100%" stopColor="#FF375F" />
                    </linearGradient>
                    <linearGradient id="exerciseExtrasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF375F" />
                        <stop offset="100%" stopColor="#FF6B9D" />
                    </linearGradient>
                    <linearGradient id="exerciseCheatingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF6B9D" />
                        <stop offset="100%" stopColor="#8B0000" />
                    </linearGradient>
                </defs>

                {/* Recovery Ring (Outer) */}
                {recoverySegments ? 
                    renderSegmentedRing(
                        outerRadius,
                        config.thicknessOuter,
                        recoverySegments,
                        {
                            sleep: 'recoverySleepGradient',
                            breaks: 'recoveryBreaksGradient'
                        },
                        recoveryProgress
                    ) : (
                        <>
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
                        </>
                    )
                }

                {/* Nutrition Ring (Middle) */}
                {nutritionSegments ? 
                    renderSegmentedRing(
                        middleRadius,
                        config.thicknessMiddle,
                        nutritionSegments,
                        {
                            carbs: 'nutritionCarbsGradient',
                            protein: 'nutritionProteinGradient',
                            fats: 'nutritionFatsGradient',
                            burned: 'nutritionBurnedGradient'
                        },
                        nutritionProgress
                    ) : (
                        <>
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
                                stroke="url(#nutritionCarbsGradient)"
                                strokeWidth={config.thicknessMiddle}
                                strokeLinecap="round"
                                strokeDasharray={middleCircumference}
                                strokeDashoffset={getDashOffset(nutritionProgress, middleCircumference)}
                                transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                                className="progress-ring"
                            />
                        </>
                    )
                }

                {/* Exercise Ring (Inner) */}
                {exerciseSegments ? 
                    renderSegmentedRing(
                        innerRadius,
                        config.thicknessInner,
                        exerciseSegments,
                        {
                            activities: 'exerciseActivitiesGradient',
                            extras: 'exerciseExtrasGradient',
                            cheating: 'exerciseCheatingGradient'
                        },
                        exerciseProgress
                    ) : (
                        <>
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
                                stroke="url(#exerciseActivitiesGradient)"
                                strokeWidth={config.thicknessInner}
                                strokeLinecap="round"
                                strokeDasharray={innerCircumference}
                                strokeDashoffset={getDashOffset(exerciseProgress, innerCircumference)}
                                transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                                className="progress-ring"
                            />
                        </>
                    )
                }
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