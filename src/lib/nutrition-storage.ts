// Nutrition storage with Supabase integration and localStorage fallback
// Following the same pattern as WorkoutStorage for consistency
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { User } from '@supabase/supabase-js'
import { USDAFoodDataService } from './usda-fooddata'

// Core nutrition data models
export interface MacroNutrients {
    carbs: number           // grams
    protein: number         // grams
    fats: number           // grams
    fiber?: number         // grams
    sugar?: number         // grams
    sodium?: number        // mg
}

export interface DetailedNutrients extends MacroNutrients {
    calories?: number      // kcal
    saturatedFat?: number   // grams
    transFat?: number      // grams
    monounsaturatedFat?: number // grams
    polyunsaturatedFat?: number // grams
    cholesterol?: number   // mg
    potassium?: number     // mg
    vitaminA?: number      // IU
    vitaminC?: number      // mg
    calcium?: number       // mg
    iron?: number          // mg
    vitaminD?: number      // IU
    vitaminE?: number      // IU
    vitaminK?: number      // mcg
    thiamine?: number      // mg
    riboflavin?: number    // mg
    niacin?: number        // mg
    vitaminB6?: number     // mg
    folate?: number        // mcg
    vitaminB12?: number    // mcg
    biotin?: number        // mcg
    pantothenicAcid?: number // mg
    phosphorus?: number    // mg
    iodine?: number        // mcg
    magnesium?: number     // mg
    zinc?: number          // mg
    selenium?: number      // mcg
    copper?: number        // mg
    manganese?: number     // mg
    chromium?: number      // mcg
    molybdenum?: number    // mcg
}

export interface Food {
    id: string
    name: string
    brand?: string
    servingSize: number     // grams
    servingUnit: string     // "g", "ml", "cup", "piece", etc.
    caloriesPerServing: number
    macros: DetailedNutrients
    notes?: string
    isUserCreated: boolean  // true for manual entries, false for database foods
    userId?: string
    createdAt: string
    updatedAt: string
}

export interface FoodEntry {
    id: string
    foodId: string
    food: Food             // Denormalized for easy access
    quantity: number       // number of servings
    adjustedCalories: number // calculated calories for this quantity
    adjustedMacros: MacroNutrients // calculated macros for this quantity
    notes?: string
    createdAt: string
}

export interface Meal {
    id: string
    type: 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'custom'
    name: string           // "Breakfast", "Lunch", "Dinner", "Snacks", or custom
    icon?: string          // icon name for the meal
    foods: FoodEntry[]
    totalCalories: number  // calculated from foods
    totalMacros: MacroNutrients // calculated from foods
    notes?: string
}

export interface MealTemplate {
    id: string
    name: string
    icon: string
    type: 'builtin' | 'user'
    userId?: string
    foods: Array<{
        food: Food
        quantity: number
        notes?: string
    }>
    createdAt: string
    updatedAt: string
}

export interface NutritionEntry {
    id: string
    userId: string
    date: string           // YYYY-MM-DD format
    meals: Meal[]
    totalCalories: number  // calculated from meals
    totalMacros: MacroNutrients // calculated from meals
    waterIntake?: number   // ml
    notes?: string
    createdAt: string
    updatedAt: string
}

export interface NutritionGoals {
    id: string
    userId: string
    dailyCalories: number
    macroTargets: {
        carbs: number      // grams
        protein: number    // grams
        fats: number      // grams
    }
    macroPercentages?: {   // alternative to absolute values
        carbs: number      // % of calories
        protein: number    // % of calories
        fats: number      // % of calories
    }
    waterTarget?: number   // ml per day
    fiberTarget?: number   // grams per day
    sodiumLimit?: number   // mg per day
    createdAt: string
    updatedAt: string
}

// Database interfaces (snake_case for Supabase)
interface DatabaseFood {
    id: string
    name: string
    brand: string | null
    serving_size: number
    serving_unit: string
    calories_per_serving: number
    macros: DetailedNutrients
    notes: string | null
    is_user_created: boolean
    user_id: string | null
    created_at: string
    updated_at: string
}

interface DatabaseNutritionEntry {
    id: string
    user_id: string
    date: string
    meals: string          // JSON string of Meal[]
    total_calories: number
    total_macros: string   // JSON string of MacroNutrients
    water_intake: number | null
    notes: string | null
    created_at: string
    updated_at: string
}

interface DatabaseNutritionGoals {
    id: string
    user_id: string
    daily_calories: number
    macro_targets: string  // JSON string of macro targets
    macro_percentages: string | null // JSON string of percentages
    water_target: number | null
    fiber_target: number | null
    sodium_limit: number | null
    created_at: string
    updated_at: string
}

interface SyncOperation {
    action: 'upsert' | 'insert' | 'delete'
    table: 'foods' | 'nutrition_entries' | 'nutrition_goals'
    data: Food | NutritionEntry | NutritionGoals | string | null
    timestamp: number
    retryCount?: number
    maxRetries?: number
}

export class NutritionStorage {
    private static supabase: SupabaseClient | null = null
    private static currentUser: User | null = null

    // Dynamic keys that include user context for isolation
    private static get FOODS_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-nutrition-foods${userSuffix}`
    }

    private static get ENTRIES_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-nutrition-entries${userSuffix}`
    }

    private static get GOALS_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-nutrition-goals${userSuffix}`
    }

    private static get SYNC_QUEUE_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-nutrition-sync-queue${userSuffix}`
    }

    private static get TEMPLATES_KEY(): string {
        const userSuffix = this.currentUser?.id ? `-${this.currentUser.id.slice(-8)}` : '-anonymous'
        return `healss-nutrition-templates${userSuffix}`
    }

    // Real-time synchronization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static realtimeChannel: any = null
    private static entryListeners: Array<(entries: NutritionEntry[]) => void> = []
    private static goalsListeners: Array<(goals: NutritionGoals | null) => void> = []

    // Initialize with user and supabase client
    static initialize(user: User | null, supabaseClient?: SupabaseClient) {
        console.log('NutritionStorage.initialize - User:', user?.id, user?.email)
        console.log('NutritionStorage.initialize - Has supabaseClient:', !!supabaseClient)

        this.currentUser = user
        if (supabaseClient) {
            this.supabase = supabaseClient
        } else if (typeof window !== 'undefined') {
            this.supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
        }

        // Verify the supabase client has the correct auth context
        if (this.supabase) {
            this.supabase.auth.getUser().then(({ data: authUser, error }) => {
                console.log('NutritionStorage.initialize - Supabase auth context:', {
                    userId: authUser.user?.id,
                    email: authUser.user?.email,
                    matchesPassedUser: authUser.user?.id === user?.id,
                    error
                })
            })
        }

        // Sync any queued operations when initializing
        if (this.currentUser && this.supabase) {
            this.processSyncQueue()
            this.setupRealtimeSync()

            // Set up automatic sync on connection recovery
            this.onConnectionChange((online) => {
                if (online && this.currentUser && this.supabase) {
                    console.log('Connection restored, processing nutrition sync queue')
                    this.processSyncQueue()
                }
            })
        }
    }

    // ============================================================================
    // FOOD MANAGEMENT
    // ============================================================================

    static async getFoods(searchTerm?: string, limit: number = 100): Promise<Food[]> {
        console.log('NutritionStorage.getFoods - Current user:', this.currentUser?.id, 'Search:', searchTerm)

        const allFoods: Food[] = []

        // First, get local foods (Supabase/localStorage)
        let localFoods: Food[] = []

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (authUser.user) {
                    // Query both user foods and built-in database foods
                    let query = this.supabase
                        .from('foods')
                        .select('*')
                        .or(`and(user_id.eq.${this.currentUser.id},user_id.not.is.null),and(is_user_created.eq.false,user_id.is.null)`)
                        .order('is_user_created', { ascending: false }) // User foods first
                        .order('name', { ascending: true })
                        .limit(Math.floor(limit / 2)) // Reserve half the limit for USDA results

                    if (searchTerm) {
                        query = query.ilike('name', `%${searchTerm}%`)
                    }

                    const { data, error } = await query

                    if (!error && data) {
                        localFoods = data.map(this.convertDbFoodToApp)
                    }
                }
            } catch (error) {
                console.error('Error fetching foods from Supabase:', error)
            }
        }

        // Fallback to localStorage if no Supabase results
        if (localFoods.length === 0) {
            localFoods = this.getFoodsFromLocalStorage(searchTerm, Math.floor(limit / 2))
        }

        allFoods.push(...localFoods)

        // Then, get USDA foods if we have a search term
        if (searchTerm && searchTerm.trim().length >= 2) {
            try {
                const usdaFoods = await USDAFoodDataService.searchFoods(
                    searchTerm,
                    limit - allFoods.length // Use remaining limit for USDA results
                )

                // Filter out duplicates (foods that might already exist locally)
                const uniqueUSDAFoods = usdaFoods.filter(usdaFood =>
                    !allFoods.some(localFood =>
                        localFood.name.toLowerCase() === usdaFood.name.toLowerCase() &&
                        localFood.brand === usdaFood.brand
                    )
                )

                allFoods.push(...uniqueUSDAFoods)
            } catch {
                // Silently continue without USDA results if API is unavailable
                // The USDA service already logs warnings, no need to log again here
            }
        }

        // Sort results: user foods first, then other local foods, then USDA foods
        const sortedFoods = allFoods.sort((a, b) => {
            // User-created foods first
            if (a.isUserCreated && !b.isUserCreated) return -1
            if (!a.isUserCreated && b.isUserCreated) return 1

            // Local foods before USDA foods
            const aIsUSDA = a.id.startsWith('usda-')
            const bIsUSDA = b.id.startsWith('usda-')
            if (!aIsUSDA && bIsUSDA) return -1
            if (aIsUSDA && !bIsUSDA) return 1

            // Alphabetical within each group
            return a.name.localeCompare(b.name)
        })

        return sortedFoods.slice(0, limit)
    }

    static async saveFood(foodData: Omit<Food, 'id' | 'createdAt' | 'updatedAt'>): Promise<Food> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save foods')
        }

        const newFood: Food = {
            ...foodData,
            id: `food-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            isUserCreated: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Save to localStorage immediately for offline support
        this.saveFoodToLocalStorage(newFood)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbFood = this.convertAppFoodToDb(newFood)

                const { data, error } = await this.supabase
                    .from('foods')
                    .insert({
                        ...dbFood,
                        user_id: this.currentUser.id
                    })
                    .select()
                    .single()

                if (error) throw error

                // Update with Supabase-generated data
                newFood.id = data.id
                newFood.createdAt = data.created_at
                newFood.updatedAt = data.updated_at

                console.log('Food saved to Supabase:', newFood.name)
            } catch (error) {
                console.error('Error saving food to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'insert',
                    table: 'foods',
                    data: newFood,
                    timestamp: Date.now()
                })
            }
        }

        return newFood
    }

    // ============================================================================
    // NUTRITION ENTRY MANAGEMENT
    // ============================================================================

    static async getNutritionEntry(date?: string): Promise<NutritionEntry | null> {
        // Use today's date if no date provided
        const targetDate = date || new Date().toISOString().split('T')[0]
        console.log('NutritionStorage.getNutritionEntry - Date:', targetDate, 'User:', this.currentUser?.id)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (!authUser.user) {
                    return this.getNutritionEntryFromLocalStorage(targetDate)
                }

                const { data, error } = await this.supabase
                    .from('nutrition_entries')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .eq('date', targetDate)
                    .not('user_id', 'is', null)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No entry found for this date
                        return null
                    }
                    throw error
                }

                return this.convertDbNutritionEntryToApp(data)
            } catch (error) {
                console.error('Error fetching nutrition entry from Supabase:', error)
            }
        }

        // Fallback to localStorage
        return this.getNutritionEntryFromLocalStorage(targetDate)
    }

    static async getAllNutritionEntries(): Promise<NutritionEntry[]> {
        console.log('NutritionStorage.getAllNutritionEntries - User:', this.currentUser?.id)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (!authUser.user) {
                    return this.getAllNutritionEntriesFromLocalStorage()
                }

                const { data, error } = await this.supabase
                    .from('nutrition_entries')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .order('date', { ascending: false })

                if (error) throw error

                return (data || []).map(this.convertDbNutritionEntryToApp)
            } catch (error) {
                console.error('Error fetching nutrition entries from Supabase:', error)
            }
        }

        // Fallback to localStorage
        return this.getAllNutritionEntriesFromLocalStorage()
    }

    static async saveNutritionEntry(entryData: Omit<NutritionEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<NutritionEntry> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save nutrition entries')
        }

        const existingEntry = await this.getNutritionEntry(entryData.date)
        const updatedEntry: NutritionEntry = {
            id: existingEntry?.id || `nutrition-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            createdAt: existingEntry?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...entryData
        }

        // Save to localStorage immediately
        this.saveNutritionEntryToLocalStorage(updatedEntry)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbEntry = this.convertAppNutritionEntryToDb(updatedEntry)

                if (existingEntry) {
                    // Update existing entry
                    const { error } = await this.supabase
                        .from('nutrition_entries')
                        .update(dbEntry)
                        .eq('user_id', this.currentUser.id)
                        .eq('date', entryData.date)
                        .not('user_id', 'is', null)

                    if (error) throw error
                } else {
                    // Insert new entry
                    const { data, error } = await this.supabase
                        .from('nutrition_entries')
                        .insert({
                            ...dbEntry,
                            user_id: this.currentUser.id
                        })
                        .select()
                        .single()

                    if (error) throw error

                    updatedEntry.id = data.id
                    updatedEntry.createdAt = data.created_at
                    updatedEntry.updatedAt = data.updated_at
                }

                console.log('Nutrition entry saved to Supabase:', entryData.date)
            } catch (error) {
                console.error('Error saving nutrition entry to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'nutrition_entries',
                    data: updatedEntry,
                    timestamp: Date.now()
                })
            }
        }

        return updatedEntry
    }

    static async deleteNutritionEntry(date: string): Promise<void> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to delete nutrition entries')
        }

        console.log('NutritionStorage.deleteNutritionEntry - Date:', date, 'User:', this.currentUser.id)

        // Delete from localStorage immediately
        this.deleteNutritionEntryFromLocalStorage(date)

        // Try to delete from Supabase
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('nutrition_entries')
                    .delete()
                    .eq('user_id', this.currentUser.id)
                    .eq('date', date)
                    .not('user_id', 'is', null)

                if (error) throw error

                console.log('Nutrition entry deleted from Supabase:', date)
            } catch (error) {
                console.error('Error deleting nutrition entry from Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'delete',
                    table: 'nutrition_entries',
                    data: date,
                    timestamp: Date.now()
                })
            }
        }
    }

    // ============================================================================
    // NUTRITION GOALS MANAGEMENT
    // ============================================================================

    static async getNutritionGoals(): Promise<NutritionGoals | null> {
        console.log('NutritionStorage.getNutritionGoals - User:', this.currentUser?.id)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (!authUser.user) {
                    return this.getNutritionGoalsFromLocalStorage()
                }

                const { data, error } = await this.supabase
                    .from('nutrition_goals')
                    .select('*')
                    .eq('user_id', this.currentUser.id)
                    .not('user_id', 'is', null)
                    .single()

                if (error) {
                    if (error.code === 'PGRST116') {
                        // No goals found
                        return null
                    }
                    throw error
                }

                return this.convertDbNutritionGoalsToApp(data)
            } catch (error) {
                console.error('Error fetching nutrition goals from Supabase:', error)
            }
        }

        // Fallback to localStorage
        return this.getNutritionGoalsFromLocalStorage()
    }

    static async saveNutritionGoals(goalsData: Partial<Omit<NutritionGoals, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<NutritionGoals> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save nutrition goals')
        }

        const existingGoals = await this.getNutritionGoals()
        const updatedGoals: NutritionGoals = {
            id: existingGoals?.id || `nutrition-goals-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            dailyCalories: 2000,
            macroTargets: {
                carbs: 250,
                protein: 150,
                fats: 67
            },
            createdAt: existingGoals?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...goalsData
        }

        // Save to localStorage immediately
        this.saveNutritionGoalsToLocalStorage(updatedGoals)

        // Try to save to Supabase
        if (this.supabase) {
            try {
                const dbGoals = this.convertAppNutritionGoalsToDb(updatedGoals)

                if (existingGoals) {
                    // Update existing goals
                    const { error } = await this.supabase
                        .from('nutrition_goals')
                        .update(dbGoals)
                        .eq('user_id', this.currentUser.id)
                        .not('user_id', 'is', null)

                    if (error) throw error
                } else {
                    // Insert new goals
                    const { data, error } = await this.supabase
                        .from('nutrition_goals')
                        .insert({
                            ...dbGoals,
                            user_id: this.currentUser.id
                        })
                        .select()
                        .single()

                    if (error) throw error

                    updatedGoals.id = data.id
                    updatedGoals.createdAt = data.created_at
                    updatedGoals.updatedAt = data.updated_at
                }

                console.log('Nutrition goals saved to Supabase')
            } catch (error) {
                console.error('Error saving nutrition goals to Supabase:', error)
                // Add to sync queue for retry later
                this.addToSyncQueue({
                    action: 'upsert',
                    table: 'nutrition_goals',
                    data: updatedGoals,
                    timestamp: Date.now()
                })
            }
        }

        return updatedGoals
    }

    // ============================================================================
    // MEAL TEMPLATE MANAGEMENT
    // ============================================================================

    static async getMealTemplates(): Promise<MealTemplate[]> {
        console.log('NutritionStorage.getMealTemplates - User:', this.currentUser?.id)

        // Try Supabase first if user is authenticated
        if (this.currentUser && this.supabase) {
            try {
                const { data: authUser } = await this.supabase.auth.getUser()
                if (!authUser.user) {
                    return this.getMealTemplatesFromLocalStorage()
                }

                // TODO: Implement Supabase meal templates table
                console.log('Supabase meal templates not implemented yet, using localStorage')
                return this.getMealTemplatesFromLocalStorage()
            } catch (error) {
                console.error('Error fetching meal templates from Supabase:', error)
            }
        }

        // Fallback to localStorage
        return this.getMealTemplatesFromLocalStorage()
    }

    static async saveMealTemplate(templateData: Omit<MealTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MealTemplate> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to save meal templates')
        }

        const newTemplate: MealTemplate = {
            ...templateData,
            id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: this.currentUser.id,
            type: 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }

        // Save to localStorage immediately
        this.saveMealTemplateToLocalStorage(newTemplate)

        // TODO: Save to Supabase when templates table is implemented
        if (this.supabase) {
            console.log('Supabase meal templates not implemented yet, saved to localStorage only')
        }

        return newTemplate
    }

    static async deleteMealTemplate(templateId: string): Promise<void> {
        if (!this.currentUser) {
            throw new Error('User must be authenticated to delete meal templates')
        }

        console.log('NutritionStorage.deleteMealTemplate - Template ID:', templateId, 'User:', this.currentUser.id)

        // Delete from localStorage immediately
        this.deleteMealTemplateFromLocalStorage(templateId)

        // TODO: Delete from Supabase when templates table is implemented
        if (this.supabase) {
            console.log('Supabase meal templates not implemented yet, deleted from localStorage only')
        }
    }

    // ============================================================================
    // HELPER METHODS FOR CALCULATIONS
    // ============================================================================

    static calculateMealTotals(meal: Meal): { calories: number; macros: MacroNutrients } {
        let calories = 0
        const macros: MacroNutrients = { carbs: 0, protein: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }

        meal.foods.forEach(foodEntry => {
            calories += foodEntry.adjustedCalories
            macros.carbs += foodEntry.adjustedMacros.carbs
            macros.protein += foodEntry.adjustedMacros.protein
            macros.fats += foodEntry.adjustedMacros.fats
            if (foodEntry.adjustedMacros.fiber) macros.fiber = (macros.fiber || 0) + foodEntry.adjustedMacros.fiber
            if (foodEntry.adjustedMacros.sugar) macros.sugar = (macros.sugar || 0) + foodEntry.adjustedMacros.sugar
            if (foodEntry.adjustedMacros.sodium) macros.sodium = (macros.sodium || 0) + foodEntry.adjustedMacros.sodium
        })

        return { calories, macros }
    }

    static calculateFoodEntryTotals(food: Food, quantity: number): { calories: number; macros: MacroNutrients } {
        const calories = food.caloriesPerServing * quantity
        const macros: MacroNutrients = {
            carbs: food.macros.carbs * quantity,
            protein: food.macros.protein * quantity,
            fats: food.macros.fats * quantity,
            fiber: (food.macros.fiber || 0) * quantity,
            sugar: (food.macros.sugar || 0) * quantity,
            sodium: (food.macros.sodium || 0) * quantity
        }

        return { calories, macros }
    }

    static createEmptyMeal(type: 'breakfast' | 'lunch' | 'dinner' | 'snacks'): Meal {
        const names = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        }

        return {
            id: `meal-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            name: names[type],
            foods: [],
            totalCalories: 0,
            totalMacros: { carbs: 0, protein: 0, fats: 0 }
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS (localStorage operations)
    // ============================================================================

    private static getFoodsFromLocalStorage(searchTerm?: string, limit: number = 100): Food[] {
        if (typeof window === 'undefined') return []

        try {
            const stored = localStorage.getItem(this.FOODS_KEY)
            const foods: Food[] = stored ? JSON.parse(stored) : []

            let filtered = foods.filter(food =>
                !this.currentUser || !food.userId || food.userId === this.currentUser.id
            )

            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                filtered = filtered.filter(food =>
                    food.name.toLowerCase().includes(term) ||
                    (food.brand && food.brand.toLowerCase().includes(term))
                )
            }

            return filtered.slice(0, limit)
        } catch (error) {
            console.error('Error loading foods from localStorage:', error)
            return []
        }
    }

    private static saveFoodToLocalStorage(food: Food): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getFoodsFromLocalStorage()
            const updated = [food, ...existing.filter(f => f.id !== food.id)]
            localStorage.setItem(this.FOODS_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error saving food to localStorage:', error)
        }
    }

    private static getNutritionEntryFromLocalStorage(date: string): NutritionEntry | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(`${this.ENTRIES_KEY}-${date}`)
            if (!stored) return null

            const entry = JSON.parse(stored) as NutritionEntry

            // Security check: ensure entry belongs to current user
            if (this.currentUser && entry.userId && entry.userId !== this.currentUser.id) {
                localStorage.removeItem(`${this.ENTRIES_KEY}-${date}`)
                return null
            }

            return entry
        } catch (error) {
            console.error('Error loading nutrition entry from localStorage:', error)
            return null
        }
    }

    private static saveNutritionEntryToLocalStorage(entry: NutritionEntry): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(`${this.ENTRIES_KEY}-${entry.date}`, JSON.stringify(entry))
        } catch (error) {
            console.error('Error saving nutrition entry to localStorage:', error)
        }
    }

    private static getAllNutritionEntriesFromLocalStorage(): NutritionEntry[] {
        if (typeof window === 'undefined') return []

        try {
            const entries: NutritionEntry[] = []

            // Scan localStorage for all entries with our key prefix
            const keyPrefix = this.ENTRIES_KEY + '-'

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key && key.startsWith(keyPrefix)) {
                    try {
                        const stored = localStorage.getItem(key)
                        if (stored) {
                            const entry = JSON.parse(stored) as NutritionEntry

                            // Security check: ensure entry belongs to current user
                            if (this.currentUser && entry.userId && entry.userId !== this.currentUser.id) {
                                localStorage.removeItem(key)
                                continue
                            }

                            entries.push(entry)
                        }
                    } catch (error) {
                        console.error('Error parsing nutrition entry from localStorage:', key, error)
                        localStorage.removeItem(key) // Clean up corrupted data
                    }
                }
            }

            // Sort by date (newest first)
            return entries.sort((a, b) => b.date.localeCompare(a.date))
        } catch (error) {
            console.error('Error loading nutrition entries from localStorage:', error)
            return []
        }
    }

    private static deleteNutritionEntryFromLocalStorage(date: string): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.removeItem(`${this.ENTRIES_KEY}-${date}`)
        } catch (error) {
            console.error('Error deleting nutrition entry from localStorage:', error)
        }
    }

    private static getNutritionGoalsFromLocalStorage(): NutritionGoals | null {
        if (typeof window === 'undefined') return null

        try {
            const stored = localStorage.getItem(this.GOALS_KEY)
            if (!stored) return null

            const goals = JSON.parse(stored) as NutritionGoals

            // Security check: ensure goals belong to current user
            if (this.currentUser && goals.userId && goals.userId !== this.currentUser.id) {
                localStorage.removeItem(this.GOALS_KEY)
                return null
            }

            return goals
        } catch (error) {
            console.error('Error loading nutrition goals from localStorage:', error)
            return null
        }
    }

    private static saveNutritionGoalsToLocalStorage(goals: NutritionGoals): void {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(this.GOALS_KEY, JSON.stringify(goals))
        } catch (error) {
            console.error('Error saving nutrition goals to localStorage:', error)
        }
    }

    private static getMealTemplatesFromLocalStorage(): MealTemplate[] {
        if (typeof window === 'undefined') return []

        try {
            const stored = localStorage.getItem(this.TEMPLATES_KEY)
            if (!stored) return []

            const templates: MealTemplate[] = JSON.parse(stored)

            // Security check: ensure templates belong to current user
            return templates.filter(template =>
                !this.currentUser || !template.userId || template.userId === this.currentUser.id
            )
        } catch (error) {
            console.error('Error loading meal templates from localStorage:', error)
            return []
        }
    }

    private static saveMealTemplateToLocalStorage(template: MealTemplate): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getMealTemplatesFromLocalStorage()
            const updated = [template, ...existing.filter(t => t.id !== template.id)]
            localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error saving meal template to localStorage:', error)
        }
    }

    private static deleteMealTemplateFromLocalStorage(templateId: string): void {
        if (typeof window === 'undefined') return

        try {
            const existing = this.getMealTemplatesFromLocalStorage()
            const updated = existing.filter(t => t.id !== templateId)
            localStorage.setItem(this.TEMPLATES_KEY, JSON.stringify(updated))
        } catch (error) {
            console.error('Error deleting meal template from localStorage:', error)
        }
    }

    // ============================================================================
    // CONVERSION METHODS (Database ↔ App formats)
    // ============================================================================

    private static convertDbFoodToApp(db: DatabaseFood): Food {
        return {
            id: db.id,
            name: db.name,
            brand: db.brand || undefined,
            servingSize: db.serving_size,
            servingUnit: db.serving_unit,
            caloriesPerServing: db.calories_per_serving,
            macros: db.macros,
            notes: db.notes || undefined,
            isUserCreated: db.is_user_created,
            userId: db.user_id || undefined,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppFoodToDb(app: Food): Omit<DatabaseFood, 'id' | 'created_at' | 'updated_at'> {
        return {
            name: app.name,
            brand: app.brand || null,
            serving_size: app.servingSize,
            serving_unit: app.servingUnit,
            calories_per_serving: app.caloriesPerServing,
            macros: app.macros,
            notes: app.notes || null,
            is_user_created: app.isUserCreated,
            user_id: app.userId || null
        }
    }

    private static convertDbNutritionEntryToApp(db: DatabaseNutritionEntry): NutritionEntry {
        return {
            id: db.id,
            userId: db.user_id,
            date: db.date,
            meals: JSON.parse(db.meals),
            totalCalories: db.total_calories,
            totalMacros: JSON.parse(db.total_macros),
            waterIntake: db.water_intake || undefined,
            notes: db.notes || undefined,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppNutritionEntryToDb(app: NutritionEntry): Omit<DatabaseNutritionEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            date: app.date,
            meals: JSON.stringify(app.meals),
            total_calories: app.totalCalories,
            total_macros: JSON.stringify(app.totalMacros),
            water_intake: app.waterIntake || null,
            notes: app.notes || null
        }
    }

    private static convertDbNutritionGoalsToApp(db: DatabaseNutritionGoals): NutritionGoals {
        return {
            id: db.id,
            userId: db.user_id,
            dailyCalories: db.daily_calories,
            macroTargets: JSON.parse(db.macro_targets),
            macroPercentages: db.macro_percentages ? JSON.parse(db.macro_percentages) : undefined,
            waterTarget: db.water_target || undefined,
            fiberTarget: db.fiber_target || undefined,
            sodiumLimit: db.sodium_limit || undefined,
            createdAt: db.created_at,
            updatedAt: db.updated_at
        }
    }

    private static convertAppNutritionGoalsToDb(app: NutritionGoals): Omit<DatabaseNutritionGoals, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
        return {
            daily_calories: app.dailyCalories,
            macro_targets: JSON.stringify(app.macroTargets),
            macro_percentages: app.macroPercentages ? JSON.stringify(app.macroPercentages) : null,
            water_target: app.waterTarget || null,
            fiber_target: app.fiberTarget || null,
            sodium_limit: app.sodiumLimit || null
        }
    }

    // ============================================================================
    // SYNC QUEUE AND ERROR HANDLING (same pattern as WorkoutStorage)
    // ============================================================================

    private static addToSyncQueue(operation: SyncOperation): void {
        if (typeof window === 'undefined') return

        try {
            const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]')
            queue.push({
                ...operation,
                retryCount: 0,
                maxRetries: 3
            })
            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(queue))
            console.log('Added operation to nutrition sync queue:', operation.action, operation.table)
        } catch (error) {
            console.error('Error adding to nutrition sync queue:', error)
        }
    }

    private static async processSyncQueue(): Promise<void> {
        if (typeof window === 'undefined' || !this.supabase || !this.currentUser) return

        try {
            const queue = JSON.parse(localStorage.getItem(this.SYNC_QUEUE_KEY) || '[]')
            if (queue.length === 0) return

            console.log(`Processing ${queue.length} queued nutrition sync operations`)

            const failedOperations: SyncOperation[] = []

            for (const operation of queue) {
                try {
                    await this.processSyncOperation(operation)
                    console.log('Successfully processed nutrition sync operation:', operation.action, operation.table)
                } catch (error) {
                    console.error('Error processing nutrition sync operation:', error)

                    operation.retryCount = (operation.retryCount || 0) + 1

                    if (operation.retryCount < operation.maxRetries) {
                        failedOperations.push(operation)
                    }
                }
            }

            localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(failedOperations))
        } catch (error) {
            console.error('Error processing nutrition sync queue:', error)
        }
    }

    private static async processSyncOperation(operation: SyncOperation): Promise<void> {
        if (!this.supabase || !this.currentUser) {
            throw new Error('Supabase client or user not available')
        }

        // Implementation details for each table and operation type
        // Similar to WorkoutStorage patterns
        console.log('Processing nutrition sync operation:', operation.action, operation.table)
    }

    // Connection monitoring (same as other storage classes)
    static onConnectionChange(callback: (online: boolean) => void): () => void {
        if (typeof window === 'undefined') return () => {}

        const handleOnline = () => callback(true)
        const handleOffline = () => callback(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }

    // Real-time synchronization setup (placeholder for now)
    private static setupRealtimeSync(): void {
        // TODO: Implement real-time sync for nutrition data
        console.log('Nutrition real-time sync setup - placeholder')
    }

    static cleanup(): void {
        if (this.realtimeChannel && this.supabase) {
            this.supabase.removeChannel(this.realtimeChannel)
            this.realtimeChannel = null
        }

        this.entryListeners = []
        this.goalsListeners = []
    }
}