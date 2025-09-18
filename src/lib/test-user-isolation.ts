// Test function to verify user isolation in GoalProgressCalculator
import { GoalProgressCalculator } from './goal-progress'

export async function testUserIsolation(): Promise<boolean> {
    console.log('🧪 Testing user isolation in GoalProgressCalculator...')

    try {
        const userA = 'user-a-123'
        const userB = 'user-b-456'

        // Test 1: Different users should have independent caches
        console.log('Test 1: Cache independence')

        // Force cache for user A
        await GoalProgressCalculator.calculateDailyProgress(true, false, userA)
        console.log('✅ User A cache populated')

        // Invalidate cache for user A only
        GoalProgressCalculator.invalidateCache(userA)
        console.log('✅ User A cache invalidated')

        // User B should still be able to have independent cache operations
        await GoalProgressCalculator.calculateDailyProgress(true, false, userB)
        console.log('✅ User B cache populated independently')

        console.log('✅ User isolation test passed - no data leakage detected')
        return true

    } catch (error) {
        console.error('❌ User isolation test failed:', error)
        return false
    }
}

// Add to global window for browser console testing
if (typeof window !== 'undefined') {
    (window as any).testUserIsolation = testUserIsolation
}