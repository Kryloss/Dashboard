"use client"

import { Button } from "@/components/ui/button"
import { useNotifications } from "@/lib/contexts/NotificationContext"

export default function NotificationTestPage() {
    const notifications = useNotifications()

    const testSuccess = () => {
        notifications.success('Workout completed', {
            description: 'Saved to history',
            duration: 5000,
            action: {
                label: 'History',
                onClick: () => console.log('Navigate to history')
            }
        })
    }

    const testInfo = () => {
        notifications.info('Timer running', {
            description: 'Continues in background',
            duration: 6000,
            action: {
                label: 'Resume',
                onClick: () => console.log('Resume workout')
            }
        })
    }

    const testWarning = () => {
        notifications.warning('Timer paused', {
            description: 'Workout on hold',
            duration: 3000
        })
    }

    const testError = () => {
        notifications.error('Save failed', {
            description: 'Could not save to history',
            duration: 6000
        })
    }

    const testMultiple = () => {
        notifications.success('Exercise added', { description: 'Bench Press', duration: 2000 })
        setTimeout(() => notifications.info('Timer started', { description: 'Workout is active', duration: 2000 }), 500)
        setTimeout(() => notifications.warning('Timer paused', { description: 'Workout on hold', duration: 2000 }), 1000)
        setTimeout(() => notifications.error('Save failed', { description: 'Could not save', duration: 2000 }), 1500)
        setTimeout(() => notifications.success('Template saved', { description: '"Push Day" saved', duration: 2000 }), 2000)
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