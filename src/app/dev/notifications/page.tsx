"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/lib/contexts/NotificationContext"

export default function NotificationTestPage() {
    const notifications = useNotifications()

    const testSuccess = () => {
        notifications.success('Workout completed!', {
            description: 'Your workout has been saved to your history',
            duration: 5000,
            action: {
                label: 'View History',
                onClick: () => console.log('Navigate to history')
            }
        })
    }

    const testInfo = () => {
        notifications.info('Workout continues in background', {
            description: 'Your timer is still running. You can resume from the workout dashboard.',
            duration: 6000,
            action: {
                label: 'Resume',
                onClick: () => console.log('Resume workout')
            }
        })
    }

    const testWarning = () => {
        notifications.warning('Network connection unstable', {
            description: 'Your workout is being saved locally and will sync when connection improves',
            duration: 8000
        })
    }

    const testError = () => {
        notifications.error('Failed to save workout', {
            description: 'Could not save your workout to history. Please try again.',
            duration: 6000
        })
    }

    const testMultiple = () => {
        notifications.success('First notification', { duration: 2000 })
        setTimeout(() => notifications.info('Second notification', { duration: 3000 }), 500)
        setTimeout(() => notifications.warning('Third notification', { duration: 4000 }), 1000)
        setTimeout(() => notifications.error('Fourth notification', { duration: 5000 }), 1500)
    }

    const clearAll = () => {
        notifications.clearNotifications()
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-[#F3F4F6] p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Notification System Test</h1>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <Button
                        onClick={testSuccess}
                        className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white rounded-full"
                    >
                        Test Success
                    </Button>
                    
                    <Button
                        onClick={testInfo}
                        className="bg-gradient-to-r from-[#2A8CEA] to-[#1659BF] text-white rounded-full"
                    >
                        Test Info
                    </Button>
                    
                    <Button
                        onClick={testWarning}
                        className="bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-full"
                    >
                        Test Warning
                    </Button>
                    
                    <Button
                        onClick={testError}
                        className="bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white rounded-full"
                    >
                        Test Error
                    </Button>
                </div>

                <div className="flex gap-4">
                    <Button
                        onClick={testMultiple}
                        className="bg-gradient-to-r from-[#7A5CFF] to-[#6D28D9] text-white rounded-full"
                    >
                        Test Multiple
                    </Button>
                    
                    <Button
                        onClick={clearAll}
                        variant="ghost"
                        className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                    >
                        Clear All
                    </Button>
                </div>

                <div className="mt-12 text-[#A1A1AA]">
                    <h2 className="text-lg font-semibold mb-4">Test Scenarios</h2>
                    <ul className="space-y-2">
                        <li><strong>Success:</strong> Workout completion, template saved</li>
                        <li><strong>Info:</strong> Background workout running, updates</li>
                        <li><strong>Warning:</strong> Network issues, auto-save failures</li>
                        <li><strong>Error:</strong> Save failures, storage errors</li>
                        <li><strong>Multiple:</strong> Test stacking behavior</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}