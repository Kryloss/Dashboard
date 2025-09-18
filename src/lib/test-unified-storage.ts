// Test function to verify unified storage integration
import { WorkoutStorage } from './workout-storage'

export async function testUnifiedStorage(): Promise<boolean> {
    console.log('🧪 Testing unified storage integration...')

    try {
        // Test 1: Check if unified storage is initialized
        const syncStatus = WorkoutStorage.getStorageSyncStatus()
        console.log('Test 1 - Sync status:', syncStatus)

        if (syncStatus === null) {
            console.warn('⚠️ Unified storage not initialized - this is expected if no user is logged in')
            return false
        }

        // Test 2: Test unified save method (mock data)
        const mockActivity = {
            workoutType: 'strength' as const,
            name: 'Test Unified Storage Workout',
            durationSeconds: 1800, // 30 minutes
            exercises: [],
            completedAt: new Date().toISOString(),
            notes: 'Testing unified storage integration'
        }

        console.log('Test 2 - Attempting to save activity via unified storage...')
        const savedActivity = await WorkoutStorage.saveWorkoutActivityUnified(mockActivity)
        console.log('✅ Activity saved:', savedActivity.id)

        // Test 3: Test unified load method
        console.log('Test 3 - Attempting to load activities via unified storage...')
        const activities = await WorkoutStorage.getWorkoutActivitiesUnified(5, 0)
        console.log('✅ Activities loaded:', activities.length)

        // Test 4: Check sync status after operations
        const finalSyncStatus = WorkoutStorage.getStorageSyncStatus()
        console.log('Test 4 - Final sync status:', finalSyncStatus)

        console.log('✅ Unified storage integration test passed')
        return true

    } catch (error) {
        console.error('❌ Unified storage integration test failed:', error)
        return false
    }
}

// Add to global window for browser console testing
if (typeof window !== 'undefined') {
    (window as typeof window & { testUnifiedStorage?: () => Promise<boolean> }).testUnifiedStorage = testUnifiedStorage
}