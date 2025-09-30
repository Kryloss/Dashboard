// Canadian Nutrient File (CNF) 2015 integration
import { Food, DetailedNutrients } from './nutrition-storage'

interface CNFFoodRecord {
    FoodID: string
    FoodCode: string
    FoodGroupID: string
    FoodDescription: string
    ScientificName?: string
}

// interface CNFNutrientAmount {
//     FoodID: string
//     NutrientID: string
//     NutrientValue: string
// }

// interface CNFNutrientName {
//     NutrientID: string
//     NutrientCode: string
//     NutrientSymbol: string
//     NutrientUnit: string
//     NutrientName: string
// }

// Nutrient ID mappings from CNF
const CNF_NUTRIENT_MAPPINGS: Record<string, keyof DetailedNutrients> = {
    '208': 'calories',      // Energy (kcal)
    '203': 'protein',       // Protein (g)
    '205': 'carbs',         // Carbohydrate (g)
    '204': 'fats',          // Fat total (g)
    '291': 'fiber',         // Fiber total dietary (g)
    '269': 'sugar',         // Sugars total (g)
    '307': 'sodium',        // Sodium (mg)
    '606': 'saturatedFat',  // Fatty acids saturated (g)
    '605': 'transFat',      // Fatty acids trans (g)
    '645': 'monounsaturatedFat', // Fatty acids monounsaturated (g)
    '646': 'polyunsaturatedFat', // Fatty acids polyunsaturated (g)
    '601': 'cholesterol',   // Cholesterol (mg)
    '306': 'potassium',     // Potassium (mg)
    '320': 'vitaminA',      // Vitamin A (RAE -> IU conversion)
    '401': 'vitaminC',      // Vitamin C (mg)
    '301': 'calcium',       // Calcium (mg)
    '303': 'iron',          // Iron (mg)
    '324': 'vitaminD',      // Vitamin D (mcg -> IU conversion)
    '323': 'vitaminE',      // Vitamin E (mg)
    '430': 'vitaminK',      // Vitamin K (mcg)
    '404': 'thiamine',      // Thiamin (mg)
    '405': 'riboflavin',    // Riboflavin (mg)
    '406': 'niacin',        // Niacin (mg)
    '415': 'vitaminB6',     // Vitamin B6 (mg)
    '417': 'folate',        // Folate total (mcg)
    '418': 'vitaminB12',    // Vitamin B12 (mcg)
    '410': 'pantothenicAcid', // Pantothenic acid (mg)
    '305': 'phosphorus',    // Phosphorus (mg)
    '304': 'magnesium',     // Magnesium (mg)
    '309': 'zinc',          // Zinc (mg)
    '317': 'selenium',      // Selenium (mcg)
    '312': 'copper',        // Copper (mg)
    '315': 'manganese',     // Manganese (mg)
}

export class CNFService {
    private static foodsData: Map<string, CNFFoodRecord> = new Map()
    private static nutrientsData: Map<string, Map<string, string>> = new Map() // FoodID -> (NutrientID -> Value)
    private static initialized = false
    private static initPromise: Promise<void> | null = null

    /**
     * Initialize the CNF database by loading CSV files
     */
    static async initialize(): Promise<void> {
        // If already initialized, return
        if (this.initialized) return

        // If initialization in progress, wait for it
        if (this.initPromise) return this.initPromise

        // Start initialization
        this.initPromise = this.doInitialize()
        return this.initPromise
    }

    private static async doInitialize(): Promise<void> {
        try {
            console.log('Loading CNF database...')

            // Load food names
            const foodResponse = await fetch('/cnf/FOOD NAME.csv')
            const foodText = await foodResponse.text()
            this.parseFoodNames(foodText)

            // Load nutrient amounts
            const nutrientResponse = await fetch('/cnf/NUTRIENT AMOUNT.csv')
            const nutrientText = await nutrientResponse.text()
            this.parseNutrientAmounts(nutrientText)

            this.initialized = true
            console.log(`CNF database loaded: ${this.foodsData.size} foods`)
        } catch (error) {
            console.error('Error loading CNF database:', error)
            // Don't throw - allow app to continue without CNF
        }
    }

    /**
     * Parse FOOD NAME.csv
     */
    private static parseFoodNames(csvText: string): void {
        const lines = csvText.split('\n')
        // const headers = lines[0].split(',')

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Parse CSV with proper quote handling
            const values = this.parseCSVLine(line)
            if (values.length < 5) continue

            const foodID = values[0]
            const foodCode = values[1]
            const foodGroupID = values[2]
            const foodDescription = values[4]
            const scientificName = values[9] || undefined

            this.foodsData.set(foodID, {
                FoodID: foodID,
                FoodCode: foodCode,
                FoodGroupID: foodGroupID,
                FoodDescription: foodDescription,
                ScientificName: scientificName
            })
        }
    }

    /**
     * Parse NUTRIENT AMOUNT.csv
     */
    private static parseNutrientAmounts(csvText: string): void {
        const lines = csvText.split('\n')

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            const values = line.split(',')
            if (values.length < 3) continue

            const foodID = values[0]
            const nutrientID = values[1]
            const nutrientValue = values[2]

            if (!this.nutrientsData.has(foodID)) {
                this.nutrientsData.set(foodID, new Map())
            }

            this.nutrientsData.get(foodID)!.set(nutrientID, nutrientValue)
        }
    }

    /**
     * Parse CSV line with quote handling
     */
    private static parseCSVLine(line: string): string[] {
        const result: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
            const char = line[i]

            if (char === '"') {
                inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }

        if (current) {
            result.push(current.trim())
        }

        return result
    }

    /**
     * Search foods in CNF database
     */
    static async searchFoods(query: string, limit: number = 25): Promise<Food[]> {
        // Ensure database is loaded
        await this.initialize()

        if (!this.initialized || !query || query.trim().length < 2) {
            return []
        }

        const searchTerm = query.toLowerCase()
        const results: Food[] = []

        for (const [foodID, food] of this.foodsData.entries()) {
            if (results.length >= limit) break

            const description = food.FoodDescription.toLowerCase()
            if (description.includes(searchTerm)) {
                const nutrients = this.getNutrients(foodID)
                if (nutrients) {
                    results.push(this.convertCNFFoodToFood(food, nutrients))
                }
            }
        }

        return results
    }

    /**
     * Get all nutrients for a food
     */
    private static getNutrients(foodID: string): DetailedNutrients | null {
        const nutrientMap = this.nutrientsData.get(foodID)
        if (!nutrientMap) return null

        const nutrients: DetailedNutrients = {
            carbs: 0,
            protein: 0,
            fats: 0
        }

        // Map CNF nutrients to our format
        for (const [nutrientID, value] of nutrientMap.entries()) {
            const nutrientKey = CNF_NUTRIENT_MAPPINGS[nutrientID]
            if (nutrientKey) {
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                    // Handle unit conversions
                    if (nutrientKey === 'vitaminA') {
                        // Convert RAE to IU (1 RAE = 3.33 IU for retinol)
                        nutrients[nutrientKey] = numValue * 3.33
                    } else if (nutrientKey === 'vitaminD') {
                        // Convert mcg to IU (1 mcg = 40 IU)
                        nutrients[nutrientKey] = numValue * 40
                    } else {
                        // TypeScript-safe assignment
                        const nutrientsRecord = nutrients as Record<string, number | undefined>
                        nutrientsRecord[nutrientKey] = numValue
                    }
                }
            }
        }

        // Only return if we have at least basic macro data
        if (nutrients.protein === 0 && nutrients.carbs === 0 && nutrients.fats === 0) {
            return null
        }

        return nutrients
    }

    /**
     * Convert CNF food to our Food format
     */
    private static convertCNFFoodToFood(cnfFood: CNFFoodRecord, nutrients: DetailedNutrients): Food {
        return {
            id: `cnf-${cnfFood.FoodID}`,
            name: this.cleanFoodName(cnfFood.FoodDescription),
            brand: undefined,
            servingSize: 100,  // CNF data is per 100g
            servingUnit: 'g',
            caloriesPerServing: nutrients.calories || 0,
            macros: nutrients,
            notes: `CNF 2015 - Food Code: ${cnfFood.FoodCode}${cnfFood.ScientificName ? ` (${cnfFood.ScientificName})` : ''}`,
            isUserCreated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    /**
     * Clean food name
     */
    private static cleanFoodName(name: string): string {
        return name
            .trim()
            // Capitalize first letter
            .replace(/^./, str => str.toUpperCase())
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
    }

    /**
     * Check if CNF database is available
     */
    static isAvailable(): boolean {
        return this.initialized && this.foodsData.size > 0
    }

    /**
     * Get statistics about loaded data
     */
    static getStats(): { totalFoods: number; totalNutrients: number } {
        return {
            totalFoods: this.foodsData.size,
            totalNutrients: Array.from(this.nutrientsData.values())
                .reduce((sum, map) => sum + map.size, 0)
        }
    }
}
