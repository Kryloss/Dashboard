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
    // Subcategory progress for visual segmentation
    recoveryDetails?: {
        sleep: number      // 0-1
        breaks: number     // 0-1
    }
    nutritionDetails?: {
        calories: number   // 0-1
        carbs: number      // 0-1
        protein: number    // 0-1
        fats: number       // 0-1
        burned: number     // 0-1
    }
    exerciseDetails?: {
        activities: number // 0-1
        extras: number     // 0-1
        plan: number       // 0-1 (plan adherence)
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
        base: "#2BD2FF",
        sleep: "#2A8CEA",
        breaks: "#4FC3F7"
    },
    nutrition: {
        base: "#9BE15D", 
        calories: "#00E676",
        carbs: "#8BC34A",
        protein: "#4CAF50",
        fats: "#66BB6A",
        burned: "#FF9800"
    },
    exercise: {
        base: "#FF2D55",
        activities: "#FF375F",
        extras: "#FF6B6B",
        plan: "#E53E3E"
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
    recoveryDetails,
    nutritionDetails,
    exerciseDetails
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
                    {/* Recovery gradients for segments */}
                    <linearGradient id="recoverySleepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.recovery.sleep} />
                        <stop offset="100%" stopColor={ringColors.recovery.base} />
                    </linearGradient>
                    <linearGradient id="recoveryBreaksGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.recovery.breaks} />
                        <stop offset="100%" stopColor={ringColors.recovery.base} />
                    </linearGradient>
                    
                    {/* Nutrition gradients for segments */}
                    <linearGradient id="nutritionCaloriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.calories} />
                        <stop offset="100%" stopColor={ringColors.nutrition.base} />
                    </linearGradient>
                    <linearGradient id="nutritionCarbsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.carbs} />
                        <stop offset="100%" stopColor={ringColors.nutrition.base} />
                    </linearGradient>
                    <linearGradient id="nutritionProteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.protein} />
                        <stop offset="100%" stopColor={ringColors.nutrition.base} />
                    </linearGradient>
                    <linearGradient id="nutritionFatsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.fats} />
                        <stop offset="100%" stopColor={ringColors.nutrition.base} />
                    </linearGradient>
                    <linearGradient id="nutritionBurnedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.nutrition.burned} />
                        <stop offset="100%" stopColor={ringColors.nutrition.base} />
                    </linearGradient>
                    
                    {/* Exercise gradients for segments */}
                    <linearGradient id="exerciseActivitiesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.exercise.activities} />
                        <stop offset="100%" stopColor={ringColors.exercise.base} />
                    </linearGradient>
                    <linearGradient id="exerciseExtrasGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.exercise.extras} />
                        <stop offset="100%" stopColor={ringColors.exercise.base} />
                    </linearGradient>
                    <linearGradient id="exercisePlanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={ringColors.exercise.plan} />
                        <stop offset="100%" stopColor={ringColors.exercise.base} />
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
                {/* Recovery Ring Segments */}
                {recoveryDetails ? (
                    <>
                        {/* Sleep segment (first 50% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={outerRadius}
                            fill="none"
                            stroke="url(#recoverySleepGradient)"
                            strokeWidth={config.thicknessOuter}
                            strokeLinecap="round"
                            strokeDasharray={`${outerCircumference * 0.5} ${outerCircumference * 0.5}`}
                            strokeDashoffset={getDashOffset(recoveryDetails.sleep * 0.5, outerCircumference)}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={recoveryDetails.sleep * 0.5 + 0.5}
                        />
                        
                        {/* Breaks segment (second 50% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={outerRadius}
                            fill="none"
                            stroke="url(#recoveryBreaksGradient)"
                            strokeWidth={config.thicknessOuter}
                            strokeLinecap="round"
                            strokeDasharray={`${outerCircumference * 0.5} ${outerCircumference * 0.5}`}
                            strokeDashoffset={getDashOffset(recoveryDetails.breaks * 0.5, outerCircumference) - outerCircumference * 0.5}
                            transform={`rotate(90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={recoveryDetails.breaks * 0.5 + 0.5}
                        />
                    </>
                ) : (
                    /* Default single ring if no details provided */
                    <circle
                        cx={config.canvas / 2}
                        cy={config.canvas / 2}
                        r={outerRadius}
                        fill="none"
                        stroke="url(#recoverySleepGradient)"
                        strokeWidth={config.thicknessOuter}
                        strokeLinecap="round"
                        strokeDasharray={outerCircumference}
                        strokeDashoffset={getDashOffset(recoveryProgress, outerCircumference)}
                        transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                        className="progress-ring"
                    />
                )}

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
                {/* Nutrition Ring Segments */}
                {nutritionDetails ? (
                    <>
                        {/* Calories segment (40% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={middleRadius}
                            fill="none"
                            stroke="url(#nutritionCaloriesGradient)"
                            strokeWidth={config.thicknessMiddle}
                            strokeLinecap="round"
                            strokeDasharray={`${middleCircumference * 0.4} ${middleCircumference * 0.6}`}
                            strokeDashoffset={getDashOffset(nutritionDetails.calories * 0.4, middleCircumference)}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={nutritionDetails.calories * 0.6 + 0.4}
                        />
                        
                        {/* Carbs segment (15% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={middleRadius}
                            fill="none"
                            stroke="url(#nutritionCarbsGradient)"
                            strokeWidth={config.thicknessMiddle}
                            strokeLinecap="round"
                            strokeDasharray={`${middleCircumference * 0.15} ${middleCircumference * 0.85}`}
                            strokeDashoffset={getDashOffset(nutritionDetails.carbs * 0.15, middleCircumference) - middleCircumference * 0.4}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={nutritionDetails.carbs * 0.6 + 0.4}
                        />
                        
                        {/* Protein segment (15% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={middleRadius}
                            fill="none"
                            stroke="url(#nutritionProteinGradient)"
                            strokeWidth={config.thicknessMiddle}
                            strokeLinecap="round"
                            strokeDasharray={`${middleCircumference * 0.15} ${middleCircumference * 0.85}`}
                            strokeDashoffset={getDashOffset(nutritionDetails.protein * 0.15, middleCircumference) - middleCircumference * 0.55}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={nutritionDetails.protein * 0.6 + 0.4}
                        />
                        
                        {/* Fats segment (15% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={middleRadius}
                            fill="none"
                            stroke="url(#nutritionFatsGradient)"
                            strokeWidth={config.thicknessMiddle}
                            strokeLinecap="round"
                            strokeDasharray={`${middleCircumference * 0.15} ${middleCircumference * 0.85}`}
                            strokeDashoffset={getDashOffset(nutritionDetails.fats * 0.15, middleCircumference) - middleCircumference * 0.7}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={nutritionDetails.fats * 0.6 + 0.4}
                        />
                        
                        {/* Burned calories segment (15% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={middleRadius}
                            fill="none"
                            stroke="url(#nutritionBurnedGradient)"
                            strokeWidth={config.thicknessMiddle}
                            strokeLinecap="round"
                            strokeDasharray={`${middleCircumference * 0.15} ${middleCircumference * 0.85}`}
                            strokeDashoffset={getDashOffset(nutritionDetails.burned * 0.15, middleCircumference) - middleCircumference * 0.85}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={nutritionDetails.burned * 0.6 + 0.4}
                        />
                    </>
                ) : (
                    /* Default single ring if no details provided */
                    <circle
                        cx={config.canvas / 2}
                        cy={config.canvas / 2}
                        r={middleRadius}
                        fill="none"
                        stroke="url(#nutritionCaloriesGradient)"
                        strokeWidth={config.thicknessMiddle}
                        strokeLinecap="round"
                        strokeDasharray={middleCircumference}
                        strokeDashoffset={getDashOffset(nutritionProgress, middleCircumference)}
                        transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                        className="progress-ring"
                    />
                )}

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
                {/* Exercise Ring Segments */}
                {exerciseDetails ? (
                    <>
                        {/* Activities segment (60% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={innerRadius}
                            fill="none"
                            stroke="url(#exerciseActivitiesGradient)"
                            strokeWidth={config.thicknessInner}
                            strokeLinecap="round"
                            strokeDasharray={`${innerCircumference * 0.6} ${innerCircumference * 0.4}`}
                            strokeDashoffset={getDashOffset(exerciseDetails.activities * 0.6, innerCircumference)}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={exerciseDetails.activities * 0.6 + 0.4}
                        />
                        
                        {/* Extras segment (20% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={innerRadius}
                            fill="none"
                            stroke="url(#exerciseExtrasGradient)"
                            strokeWidth={config.thicknessInner}
                            strokeLinecap="round"
                            strokeDasharray={`${innerCircumference * 0.2} ${innerCircumference * 0.8}`}
                            strokeDashoffset={getDashOffset(exerciseDetails.extras * 0.2, innerCircumference) - innerCircumference * 0.6}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={exerciseDetails.extras * 0.6 + 0.4}
                        />
                        
                        {/* Plan adherence segment (20% of ring) */}
                        <circle
                            cx={config.canvas / 2}
                            cy={config.canvas / 2}
                            r={innerRadius}
                            fill="none"
                            stroke="url(#exercisePlanGradient)"
                            strokeWidth={config.thicknessInner}
                            strokeLinecap="round"
                            strokeDasharray={`${innerCircumference * 0.2} ${innerCircumference * 0.8}`}
                            strokeDashoffset={getDashOffset(exerciseDetails.plan * 0.2, innerCircumference) - innerCircumference * 0.8}
                            transform={`rotate(-90 ${config.canvas / 2} ${config.canvas / 2})`}
                            className="progress-ring"
                            opacity={exerciseDetails.plan * 0.6 + 0.4}
                        />
                    </>
                ) : (
                    /* Default single ring if no details provided */
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
                )}
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