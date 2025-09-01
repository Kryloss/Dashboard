"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isOnSubdomain } from "@/lib/subdomains"
import { StrengthWorkout } from "./components/strength-workout"

export default function WorkoutSessionPage() {
    const params = useParams()
    const router = useRouter()
    const [isHealssSubdomain, setIsHealssSubdomain] = useState(false)

    const workoutType = params.type as string
    const workoutId = params.id as string

    useEffect(() => {
        const onHealss = isOnSubdomain('healss')
        setIsHealssSubdomain(onHealss)

        if (!onHealss) {
            return
        }

        // Validate workout type
        const validTypes = ['strength', 'running', 'yoga', 'cycling']
        if (!validTypes.includes(workoutType)) {
            router.push('/workout')
            return
        }

        // For now, only strength is available
        if (workoutType !== 'strength') {
            router.push('/workout')
            return
        }
    }, [workoutType, workoutId, router])

    // If we're on healss.kryloss.com, show workout session
    if (isHealssSubdomain && workoutType === 'strength') {
        return <StrengthWorkout workoutId={workoutId} />
    }

    // If not on healss subdomain or invalid type, show error
    return (
        <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-[#F3F4F6] mb-4">Page Not Found</h1>
                <p className="text-[#A1A1AA]">
                    {!isHealssSubdomain
                        ? "This page is only available on the healss subdomain."
                        : "Invalid workout type or this workout type is not available yet."
                    }
                </p>
            </div>
        </div>
    )
}