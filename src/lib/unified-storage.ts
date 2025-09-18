// Unified Storage Interface - Coordinates Supabase and localStorage
// Eliminates sync conflicts and provides single source of truth

import { SupabaseClient, User } from '@supabase/supabase-js'

export interface StorageOperation {
    id: string
    type: 'activity' | 'ongoing' | 'template' | 'goals' | 'sleep'
    operation: 'create' | 'update' | 'delete'
    data: Record<string, unknown>
    timestamp: number
    userId: string
    synced: boolean
    retryCount: number
}

export interface UnifiedStorageConfig {
    maxRetries: number
    syncInterval: number
    offlineQueueLimit: number
}

export class UnifiedWorkoutStorage {
    private userId: string
    private supabase: SupabaseClient
    private config: UnifiedStorageConfig
    private syncQueue: StorageOperation[] = []
    private syncInterval: NodeJS.Timeout | null = null
    private isOnline: boolean = navigator.onLine

    constructor(user: User, supabase: SupabaseClient, config?: Partial<UnifiedStorageConfig>) {
        this.userId = user.id
        this.supabase = supabase
        this.config = {
            maxRetries: 3,
            syncInterval: 30000, // 30 seconds
            offlineQueueLimit: 100,
            ...config
        }

        // Monitor online/offline status
        this.setupNetworkListeners()

        // Start background sync
        this.startBackgroundSync()

        // Load pending operations from localStorage on init
        this.loadSyncQueue()
    }

    // UNIFIED SAVE - Always succeeds immediately, syncs in background
    async save(type: StorageOperation['type'], data: Record<string, unknown> | unknown, operation: StorageOperation['operation'] = 'create'): Promise<string> {
        const operationId = `${type}-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // 1. IMMEDIATE: Save to localStorage (user sees instant feedback)
        await this.saveToLocal(type, data)

        // 2. QUEUE: Add to sync queue for background processing
        const storageOperation: StorageOperation = {
            id: operationId,
            type,
            operation,
            data: { ...(data as Record<string, unknown>), userId: this.userId },
            timestamp: Date.now(),
            userId: this.userId,
            synced: false,
            retryCount: 0
        }

        this.addToSyncQueue(storageOperation)

        // 3. ATTEMPT: Try immediate sync if online
        if (this.isOnline) {
            this.processSyncQueue()
        }

        return operationId
    }

    // UNIFIED LOAD - Smart fallback strategy
    async load(type: StorageOperation['type']): Promise<Record<string, unknown>[]> {
        try {
            // 1. TRY: Supabase first (source of truth)
            if (this.isOnline) {
                const supabaseData = await this.loadFromSupabase(type)

                // Update local cache with fresh data
                await this.updateLocalCache(type, supabaseData)

                return supabaseData
            }
        } catch (error) {
            console.warn(`Supabase load failed for ${type}, falling back to localStorage:`, error)
        }

        // 2. FALLBACK: localStorage (offline or Supabase failure)
        return this.loadFromLocal(type)
    }

    // PRIVATE: Save to localStorage with user isolation
    private async saveToLocal(type: StorageOperation['type'], data: Record<string, unknown> | unknown): Promise<void> {
        const key = this.getLocalStorageKey(type)

        try {
            const existingData = this.loadFromLocalSync(type)
            let updatedData: Record<string, unknown>[]

            if (Array.isArray(existingData)) {
                // Update existing item or add new one
                const existingIndex = existingData.findIndex(item => (item as Record<string, unknown>).id === (data as Record<string, unknown>).id)
                if (existingIndex >= 0) {
                    updatedData = [...existingData]
                    updatedData[existingIndex] = { ...(data as Record<string, unknown>), updatedAt: new Date().toISOString() }
                } else {
                    updatedData = [{ ...(data as Record<string, unknown>), createdAt: new Date().toISOString() }, ...existingData]
                }
            } else {
                updatedData = [{ ...(data as Record<string, unknown>), createdAt: new Date().toISOString() }]
            }

            localStorage.setItem(key, JSON.stringify(updatedData))
        } catch (error) {
            console.error(`Failed to save to localStorage (${type}):`, error)
            throw error
        }
    }

    // PRIVATE: Load from localStorage with user isolation
    private loadFromLocal(type: StorageOperation['type']): Promise<Record<string, unknown>[]> {
        return Promise.resolve(this.loadFromLocalSync(type))
    }

    private loadFromLocalSync(type: StorageOperation['type']): Record<string, unknown>[] {
        const key = this.getLocalStorageKey(type)

        try {
            const data = localStorage.getItem(key)
            return data ? JSON.parse(data) : []
        } catch (error) {
            console.error(`Failed to load from localStorage (${type}):`, error)
            return []
        }
    }

    // PRIVATE: Load from Supabase with user filtering
    private async loadFromSupabase(type: StorageOperation['type']): Promise<Record<string, unknown>[]> {
        const tableName = this.getSupabaseTable(type)

        const { data, error } = await this.supabase
            .from(tableName)
            .select('*')
            .eq('user_id', this.userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw new Error(`Supabase query failed: ${error.message}`)
        }

        return data || []
    }

    // PRIVATE: Save to Supabase with proper user association
    private async saveToSupabase(operation: StorageOperation): Promise<void> {
        const tableName = this.getSupabaseTable(operation.type)
        const dataWithUser = { ...operation.data, user_id: this.userId }

        if (operation.operation === 'create') {
            const { error } = await this.supabase
                .from(tableName)
                .insert(dataWithUser)

            if (error) {
                throw new Error(`Supabase insert failed: ${error.message}`)
            }
        } else if (operation.operation === 'update') {
            const { error } = await this.supabase
                .from(tableName)
                .update(dataWithUser)
                .eq('id', operation.data.id)
                .eq('user_id', this.userId)

            if (error) {
                throw new Error(`Supabase update failed: ${error.message}`)
            }
        } else if (operation.operation === 'delete') {
            const { error } = await this.supabase
                .from(tableName)
                .delete()
                .eq('id', operation.data.id)
                .eq('user_id', this.userId)

            if (error) {
                throw new Error(`Supabase delete failed: ${error.message}`)
            }
        }
    }

    // PRIVATE: Update local cache with fresh Supabase data
    private async updateLocalCache(type: StorageOperation['type'], data: Record<string, unknown>[]): Promise<void> {
        const key = this.getLocalStorageKey(type)
        localStorage.setItem(key, JSON.stringify(data))
    }

    // PRIVATE: Get user-specific localStorage key
    private getLocalStorageKey(type: StorageOperation['type']): string {
        const userSuffix = this.userId.slice(-8) // Last 8 chars of user ID
        return `healss-${type}-${userSuffix}`
    }

    // PRIVATE: Map storage types to Supabase table names
    private getSupabaseTable(type: StorageOperation['type']): string {
        const tableMap = {
            activity: 'workout_activities',
            ongoing: 'ongoing_workouts',
            template: 'workout_templates',
            goals: 'user_goals',
            sleep: 'sleep_data'
        }
        return tableMap[type]
    }

    // PRIVATE: Sync queue management
    private addToSyncQueue(operation: StorageOperation): void {
        // Remove any existing operation with same ID to avoid duplicates
        this.syncQueue = this.syncQueue.filter(op => op.id !== operation.id)

        // Add new operation
        this.syncQueue.push(operation)

        // Enforce queue limit
        if (this.syncQueue.length > this.config.offlineQueueLimit) {
            this.syncQueue = this.syncQueue.slice(-this.config.offlineQueueLimit)
        }

        // Persist queue to localStorage
        this.persistSyncQueue()
    }

    private loadSyncQueue(): void {
        try {
            const queueKey = `healss-sync-queue-${this.userId.slice(-8)}`
            const queueData = localStorage.getItem(queueKey)
            if (queueData) {
                this.syncQueue = JSON.parse(queueData)
            }
        } catch (error) {
            console.error('Failed to load sync queue:', error)
            this.syncQueue = []
        }
    }

    private persistSyncQueue(): void {
        try {
            const queueKey = `healss-sync-queue-${this.userId.slice(-8)}`
            localStorage.setItem(queueKey, JSON.stringify(this.syncQueue))
        } catch (error) {
            console.error('Failed to persist sync queue:', error)
        }
    }

    // PRIVATE: Background sync processing
    private async processSyncQueue(): Promise<void> {
        if (!this.isOnline || this.syncQueue.length === 0) {
            return
        }

        const unsynced = this.syncQueue.filter(op => !op.synced && op.retryCount < this.config.maxRetries)

        for (const operation of unsynced) {
            try {
                await this.saveToSupabase(operation)

                // Mark as synced
                operation.synced = true
                console.log(`✅ Synced operation: ${operation.type} ${operation.operation}`)

            } catch (error) {
                operation.retryCount++
                console.warn(`❌ Sync failed (attempt ${operation.retryCount}/${this.config.maxRetries}):`, error)

                if (operation.retryCount >= this.config.maxRetries) {
                    console.error(`🚫 Operation permanently failed: ${operation.type} ${operation.operation}`)
                }
            }
        }

        // Remove successfully synced operations
        this.syncQueue = this.syncQueue.filter(op => !op.synced)
        this.persistSyncQueue()
    }

    private startBackgroundSync(): void {
        this.syncInterval = setInterval(() => {
            this.processSyncQueue()
        }, this.config.syncInterval)
    }

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            this.isOnline = true
            console.log('📶 Back online - processing sync queue')
            this.processSyncQueue()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            console.log('📵 Gone offline - queueing operations')
        })
    }

    // PUBLIC: Cleanup method
    dispose(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval)
        }
        window.removeEventListener('online', this.setupNetworkListeners)
        window.removeEventListener('offline', this.setupNetworkListeners)
    }

    // PUBLIC: Get sync queue status for debugging
    getSyncStatus(): { pending: number; failed: number; online: boolean } {
        const pending = this.syncQueue.filter(op => !op.synced && op.retryCount < this.config.maxRetries).length
        const failed = this.syncQueue.filter(op => op.retryCount >= this.config.maxRetries).length

        return {
            pending,
            failed,
            online: this.isOnline
        }
    }

    // PUBLIC: Force sync all pending operations
    async forceSyncAll(): Promise<void> {
        await this.processSyncQueue()
    }
}