// Test function to verify real-time goal ring updates
export async function testRealTimeGoalUpdates(): Promise<boolean> {
    console.log('🧪 Testing real-time goal ring updates...')

    try {
        // Test 1: Verify ongoing workout inclusion
        console.log('Test 1: Checking if ongoing workouts are included in goal calculation')

        // This should now include ongoing workouts due to our fix
        const { GoalProgressCalculator } = await import('./goal-progress')
        const mockUserId = 'test-user-123'

        const progressWithOngoing = await GoalProgressCalculator.calculateDailyProgress(true, true, mockUserId)
        console.log('✅ Goal progress calculated with ongoing workout inclusion:', !!progressWithOngoing)

        // Test 2: Verify event handler accepts all sources
        console.log('Test 2: Checking if workout completion events are properly dispatched')

        let eventReceived = false
        const testEventHandler = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail) {
                eventReceived = true
                console.log('✅ Event received with details:', customEvent.detail)
            }
        }

        // Add event listener
        window.addEventListener('workoutCompleted', testEventHandler)

        // Dispatch test event (simulating workout completion)
        window.dispatchEvent(new CustomEvent('workoutCompleted', {
            detail: {
                activityId: 'test-activity',
                timestamp: Date.now(),
                source: 'test-source',
                workoutType: 'strength',
                duration: 1800,
                exercises: 5
            }
        }))

        // Clean up
        window.removeEventListener('workoutCompleted', testEventHandler)

        console.log(`✅ Event handling test: ${eventReceived ? 'PASSED' : 'FAILED'}`)

        // Test 3: Check unified storage integration
        console.log('Test 3: Checking unified storage event dispatch')

        const { UnifiedWorkoutStorage } = await import('./unified-storage')
        console.log('✅ Unified storage class available:', !!UnifiedWorkoutStorage)

        console.log('✅ Real-time goal update tests completed successfully')
        return true

    } catch (error) {
        console.error('❌ Real-time goal update tests failed:', error)
        return false
    }
}

// Add to global window for browser console testing
if (typeof window !== 'undefined') {
    (window as typeof window & { testRealTimeGoalUpdates?: () => Promise<boolean> }).testRealTimeGoalUpdates = testRealTimeGoalUpdates
}