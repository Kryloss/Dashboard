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

// Nutrient ID mappings from USDA FoodData Central
const NUTRIENT_MAPPINGS = {
    // Energy and macronutrients
    208: 'calories',        // Energy (kcal)
    205: 'carbs',          // Carbohydrate, by difference (g)
    203: 'protein',        // Protein (g)
    204: 'fats',           // Total lipid (fat) (g)

    // Detailed nutrients
    291: 'fiber',          // Fiber, total dietary (g)
    269: 'sugar',          // Sugars, total including NLEA (g)
    307: 'sodium',         // Sodium, Na (mg)
    606: 'saturatedFat',   // Fatty acids, total saturated (g)
    605: 'transFat',       // Fatty acids, total trans (g)
    645: 'monounsaturatedFat', // Fatty acids, total monounsaturated (g)
    646: 'polyunsaturatedFat', // Fatty acids, total polyunsaturated (g)
    601: 'cholesterol',    // Cholesterol (mg)
    306: 'potassium',      // Potassium, K (mg)

    // Vitamins
    318: 'vitaminA',       // Vitamin A, IU (IU)
    401: 'vitaminC',       // Vitamin C, total ascorbic acid (mg)
    301: 'calcium',        // Calcium, Ca (mg)
    303: 'iron',           // Iron, Fe (mg)
    324: 'vitaminD',       // Vitamin D (D2 + D3) (IU)
    323: 'vitaminE',       // Vitamin E (alpha-tocopherol) (mg)
    430: 'vitaminK',       // Vitamin K (phylloquinone) (mcg)
    404: 'thiamine',       // Thiamin (mg)
    405: 'riboflavin',     // Riboflavin (mg)
    406: 'niacin',         // Niacin (mg)
    415: 'vitaminB6',      // Vitamin B-6 (mg)
    435: 'folate',         // Folate, total (mcg)
    418: 'vitaminB12',     // Vitamin B-12 (mcg)
    // 317: 'biotin',      // Biotin (mcg) - conflicts with selenium
    410: 'pantothenicAcid', // Pantothenic acid (mg)
    305: 'phosphorus',     // Phosphorus, P (mg)
    314: 'iodine',         // Iodine, I (mcg)
    304: 'magnesium',      // Magnesium, Mg (mg)
    309: 'zinc',           // Zinc, Zn (mg)
    317: 'selenium',       // Selenium, Se (mcg)
    312: 'copper',         // Copper, Cu (mg)
    315: 'manganese',      // Manganese, Mn (mg)
    310: 'chromium',       // Chromium, Cr (mcg)
    316: 'molybdenum'      // Molybdenum, Mo (mcg)
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
                throw new Error(`API error: ${response.status} ${response.statusText}`)
            }

            const data: USDASearchResult = await response.json()

            return data.foods?.map(usdaFood => this.convertUSDAFoodToAppFood(usdaFood)) || []
        } catch (error) {
            console.error('Error searching USDA foods:', error)
            throw error
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