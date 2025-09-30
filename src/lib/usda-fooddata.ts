// USDA FoodData Central API integration for nutrition tracking
import { Food, DetailedNutrients } from './nutrition-storage'

// USDA FoodData Central API types
interface USDAFood {
    fdcId: number
    description: string
    brandOwner?: string
    brandName?: string
    dataType: string
    foodNutrients: USDANutrient[]
    servingSize?: number
    servingSizeUnit?: string
    householdServingFullText?: string
}

interface USDANutrient {
    nutrientId: number
    nutrientName: string
    nutrientNumber: string
    unitName: string
    value: number
    rank?: number
}

interface USDASearchResult {
    totalHits: number
    currentPage: number
    totalPages: number
    foods: USDAFood[]
}

// Nutrient ID mappings from USDA FoodData Central (using nutrientId, not nutrientNumber)
const NUTRIENT_MAPPINGS = {
    // Energy and macronutrients
    1008: 'calories',       // Energy (kcal)
    1005: 'carbs',         // Carbohydrate, by difference (g)
    1003: 'protein',       // Protein (g)
    1004: 'fats',          // Total lipid (fat) (g)

    // Detailed nutrients
    1079: 'fiber',         // Fiber, total dietary (g)
    2000: 'sugar',         // Sugars, total including NLEA (g)
    1093: 'sodium',        // Sodium, Na (mg)
    1258: 'saturatedFat',  // Fatty acids, total saturated (g)
    1257: 'transFat',      // Fatty acids, total trans (g)
    1292: 'monounsaturatedFat', // Fatty acids, total monounsaturated (g)
    1293: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated (g)
    1253: 'cholesterol',   // Cholesterol (mg)
    1092: 'potassium',     // Potassium, K (mg)

    // Vitamins
    1104: 'vitaminA',      // Vitamin A, IU (IU)
    1162: 'vitaminC',      // Vitamin C, total ascorbic acid (mg)
    1087: 'calcium',       // Calcium, Ca (mg)
    1089: 'iron',          // Iron, Fe (mg)
    1114: 'vitaminD',      // Vitamin D (D2 + D3) (IU)
    1109: 'vitaminE',      // Vitamin E (alpha-tocopherol) (mg)
    1185: 'vitaminK',      // Vitamin K (phylloquinone) (mcg)
    1165: 'thiamine',      // Thiamin (mg)
    1166: 'riboflavin',    // Riboflavin (mg)
    1167: 'niacin',        // Niacin (mg)
    1175: 'vitaminB6',     // Vitamin B-6 (mg)
    1177: 'folate',        // Folate, total (mcg)
    1178: 'vitaminB12',    // Vitamin B-12 (mcg)
    1176: 'pantothenicAcid', // Pantothenic acid (mg)
    1170: 'biotin',        // Biotin (mcg)
    1091: 'phosphorus',    // Phosphorus, P (mg)
    1100: 'magnesium',     // Magnesium, Mg (mg)
    1095: 'zinc',          // Zinc, Zn (mg)
    1103: 'selenium',      // Selenium, Se (mcg)
    1098: 'copper',        // Copper, Cu (mg)
    1101: 'manganese',     // Manganese, Mn (mg)
    1046: 'iodine',        // Iodine, I (mcg)
    1096: 'chromium',      // Chromium, Cr (mcg)
    1102: 'molybdenum'     // Molybdenum, Mo (mcg)
} as const

export class USDAFoodDataService {
    /**
     * Search for foods using our API proxy to USDA FoodData Central
     */
    static async searchFoods(query: string, pageSize: number = 25): Promise<Food[]> {
        if (!query || query.trim().length < 2) {
            return []
        }

        try {
            const searchParams = new URLSearchParams({
                query: query.trim(),
                pageSize: pageSize.toString()
            })

            const response = await fetch(`/api/usda/search?${searchParams}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                console.warn(`USDA API unavailable: ${response.status} ${response.statusText}`)
                // Return empty array instead of throwing - gracefully fall back to local foods only
                return []
            }

            const data: USDASearchResult = await response.json()

            return data.foods?.map(usdaFood => this.convertUSDAFoodToAppFood(usdaFood)) || []
        } catch (error) {
            console.warn('USDA API unavailable, using local foods only:', error)
            // Return empty array instead of throwing - gracefully fall back to local foods only
            return []
        }
    }

    /**
     * Get detailed food information by FDC ID
     */
    static async getFoodDetails(fdcId: number): Promise<Food | null> {
        try {
            const response = await fetch(`/api/usda/food/${fdcId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 404) {
                    return null
                }
                throw new Error(`API error: ${response.status} ${response.statusText}`)
            }

            const usdaFood: USDAFood = await response.json()
            return this.convertUSDAFoodToAppFood(usdaFood)
        } catch (error) {
            console.error('Error fetching USDA food details:', error)
            throw error
        }
    }

    /**
     * Convert USDA food data to our app's Food format
     */
    private static convertUSDAFoodToAppFood(usdaFood: USDAFood): Food {
        const nutrients = this.extractNutrients(usdaFood.foodNutrients)

        // Determine serving size and unit
        const { servingSize, servingUnit } = this.determineServingSize(usdaFood)

        // Generate brand information
        const brand = usdaFood.brandOwner || usdaFood.brandName

        return {
            id: `usda-${usdaFood.fdcId}`,
            name: this.cleanFoodName(usdaFood.description),
            brand: brand,
            servingSize: servingSize,
            servingUnit: servingUnit,
            caloriesPerServing: nutrients.calories || 0,
            macros: nutrients,
            notes: `USDA FDC ID: ${usdaFood.fdcId}`,
            isUserCreated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    /**
     * Extract and map nutrients from USDA data
     */
    private static extractNutrients(usdaNutrients: USDANutrient[]): DetailedNutrients {
        const nutrients: DetailedNutrients = {
            carbs: 0,
            protein: 0,
            fats: 0
        }

        for (const nutrient of usdaNutrients) {
            const mappedKey = NUTRIENT_MAPPINGS[nutrient.nutrientId as keyof typeof NUTRIENT_MAPPINGS]

            if (mappedKey && nutrient.value !== undefined) {
                const value = nutrient.value

                // Handle special case for calories
                if (mappedKey === 'calories') {
                    nutrients.calories = Math.round(value)
                } else {
                    // Round to appropriate decimal places based on units
                    const roundedValue = nutrient.unitName === 'mg'
                        ? Math.round(value)
                        : Math.round(value * 100) / 100

                    // Safely assign to nutrients object using proper type assertion
                    const nutrientsRecord = nutrients as unknown as Record<string, number | undefined>
                    if (mappedKey in nutrients || ['saturatedFat', 'transFat', 'monounsaturatedFat', 'polyunsaturatedFat', 'cholesterol', 'potassium', 'vitaminA', 'vitaminC', 'calcium', 'iron', 'vitaminD', 'vitaminE', 'vitaminK', 'thiamine', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'pantothenicAcid', 'phosphorus', 'iodine', 'magnesium', 'zinc', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum'].includes(mappedKey)) {
                        nutrientsRecord[mappedKey] = roundedValue
                    }
                }
            }
        }
        return nutrients
    }

    /**
     * Determine appropriate serving size and unit
     */
    private static determineServingSize(usdaFood: USDAFood): { servingSize: number; servingUnit: string } {
        // Try to use provided serving size
        if (usdaFood.servingSize && usdaFood.servingSizeUnit) {
            return {
                servingSize: usdaFood.servingSize,
                servingUnit: usdaFood.servingSizeUnit
            }
        }

        // Try to parse household serving if available
        if (usdaFood.householdServingFullText) {
            const householdMatch = usdaFood.householdServingFullText.match(/^(\d+(?:\.\d+)?)\s*(.+)/)
            if (householdMatch) {
                return {
                    servingSize: parseFloat(householdMatch[1]),
                    servingUnit: householdMatch[2].trim()
                }
            }
        }

        // Default to 100g serving
        return {
            servingSize: 100,
            servingUnit: 'g'
        }
    }

    /**
     * Clean and format food names from USDA descriptions
     */
    private static cleanFoodName(description: string): string {
        // Remove common USDA formatting artifacts
        let cleaned = description
            .replace(/,\s*(UPC|GTIN):\s*\d+/gi, '') // Remove UPC/GTIN codes
            .replace(/,\s*raw$/i, ', Raw') // Capitalize raw
            .replace(/,\s*cooked$/i, ', Cooked') // Capitalize cooked
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim()

        // Capitalize first letter
        if (cleaned.length > 0) {
            cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
        }

        return cleaned
    }

    /**
     * Check if the service is available
     */
    static async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch('/api/usda/search?query=apple&pageSize=1')
            return response.ok
        } catch {
            return false
        }
    }
}