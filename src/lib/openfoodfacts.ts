// OpenFoodFacts API integration for nutrition tracking
import { Food, DetailedNutrients } from './nutrition-storage'

// OpenFoodFacts API types
interface OFFProduct {
    product_name: string
    brands?: string
    product_name_en?: string
    image_url?: string
    nutriments: OFFNutriments
    serving_size?: string
    serving_quantity?: number
    nutrition_data_per?: string
    countries_tags?: string[]
    categories?: string
    code: string  // Barcode
}

interface OFFNutriments {
    'energy-kcal_100g'?: number
    'energy-kcal_serving'?: number
    'proteins_100g'?: number
    'proteins_serving'?: number
    'carbohydrates_100g'?: number
    'carbohydrates_serving'?: number
    'fat_100g'?: number
    'fat_serving'?: number
    'fiber_100g'?: number
    'fiber_serving'?: number
    'sugars_100g'?: number
    'sugars_serving'?: number
    'salt_100g'?: number
    'salt_serving'?: number
    'sodium_100g'?: number
    'sodium_serving'?: number
    'saturated-fat_100g'?: number
    'saturated-fat_serving'?: number
    'trans-fat_100g'?: number
    'trans-fat_serving'?: number
    'cholesterol_100g'?: number
    'cholesterol_serving'?: number
    'monounsaturated-fat_100g'?: number
    'polyunsaturated-fat_100g'?: number
    'vitamin-a_100g'?: number
    'vitamin-c_100g'?: number
    'vitamin-d_100g'?: number
    'vitamin-e_100g'?: number
    'vitamin-k_100g'?: number
    'vitamin-b1_100g'?: number
    'vitamin-b2_100g'?: number
    'vitamin-b3_100g'?: number
    'vitamin-b6_100g'?: number
    'vitamin-b9_100g'?: number
    'vitamin-b12_100g'?: number
    'calcium_100g'?: number
    'iron_100g'?: number
    'magnesium_100g'?: number
    'phosphorus_100g'?: number
    'potassium_100g'?: number
    'zinc_100g'?: number
    'selenium_100g'?: number
    'copper_100g'?: number
    'manganese_100g'?: number
}

interface OFFSearchResponse {
    count: number
    page: number
    page_count: number
    page_size: number
    products: OFFProduct[]
}

interface OFFProductResponse {
    status: number
    status_verbose: string
    product?: OFFProduct
}

export class OpenFoodFactsService {
    private static readonly BASE_URL = 'https://world.openfoodfacts.org'
    private static readonly USER_AGENT = 'NutritionTracker/1.0 (https://github.com/yourusername/nutrition-tracker)'

    /**
     * Search for foods in OpenFoodFacts database
     */
    static async searchFoods(query: string, pageSize: number = 25): Promise<Food[]> {
        if (!query || query.trim().length < 2) {
            return []
        }

        try {
            const searchParams = new URLSearchParams({
                search_terms: query.trim(),
                page_size: pageSize.toString(),
                json: '1',
                fields: 'product_name,brands,code,nutriments,serving_size,serving_quantity,nutrition_data_per,image_url'
            })

            const response = await fetch(`${this.BASE_URL}/cgi/search.pl?${searchParams}`, {
                method: 'GET',
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                console.warn(`OpenFoodFacts API unavailable: ${response.status} ${response.statusText}`)
                return []
            }

            const data: OFFSearchResponse = await response.json()

            // Filter out products without basic nutrition data
            const validProducts = data.products.filter(product =>
                product.nutriments &&
                (product.nutriments['energy-kcal_100g'] || product.nutriments['energy-kcal_serving']) &&
                product.product_name
            )

            return validProducts.map(product => this.convertOFFProductToFood(product))
        } catch (error) {
            console.warn('OpenFoodFacts API unavailable:', error)
            return []
        }
    }

    /**
     * Get product by barcode
     */
    static async getProductByBarcode(barcode: string): Promise<Food | null> {
        try {
            const response = await fetch(`${this.BASE_URL}/api/v2/product/${barcode}.json`, {
                method: 'GET',
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'Accept': 'application/json'
                }
            })

            if (!response.ok) {
                return null
            }

            const data: OFFProductResponse = await response.json()

            if (data.status !== 1 || !data.product) {
                return null
            }

            return this.convertOFFProductToFood(data.product)
        } catch (error) {
            console.error('Error fetching product by barcode:', error)
            return null
        }
    }

    /**
     * Convert OpenFoodFacts product to our Food format
     */
    private static convertOFFProductToFood(product: OFFProduct): Food {
        const nutrients = this.extractNutrients(product.nutriments)
        const { servingSize, servingUnit } = this.determineServingSize(product)

        // Use English name if available, otherwise use default name
        const productName = product.product_name_en || product.product_name
        const cleanName = this.cleanProductName(productName)

        return {
            id: `off-${product.code}`,
            name: cleanName,
            brand: product.brands,
            servingSize: servingSize,
            servingUnit: servingUnit,
            caloriesPerServing: nutrients.calories || 0,
            macros: nutrients,
            notes: `OpenFoodFacts: ${product.code}`,
            isUserCreated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    }

    /**
     * Extract nutrients from OpenFoodFacts data
     */
    private static extractNutrients(nutriments: OFFNutriments): DetailedNutrients {
        // OpenFoodFacts provides data per 100g and per serving
        // We'll prefer per 100g for consistency

        const nutrients: DetailedNutrients = {
            calories: nutriments['energy-kcal_100g'] || 0,
            carbs: nutriments['carbohydrates_100g'] || 0,
            protein: nutriments['proteins_100g'] || 0,
            fats: nutriments['fat_100g'] || 0,
            fiber: nutriments['fiber_100g'],
            sugar: nutriments['sugars_100g'],
            sodium: nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : undefined, // Convert g to mg
            saturatedFat: nutriments['saturated-fat_100g'],
            transFat: nutriments['trans-fat_100g'],
            monounsaturatedFat: nutriments['monounsaturated-fat_100g'],
            polyunsaturatedFat: nutriments['polyunsaturated-fat_100g'],
            cholesterol: nutriments['cholesterol_100g'] ? nutriments['cholesterol_100g'] * 1000 : undefined, // Convert g to mg
            vitaminA: nutriments['vitamin-a_100g'] ? nutriments['vitamin-a_100g'] * 1000000 : undefined, // Convert g to IU (rough)
            vitaminC: nutriments['vitamin-c_100g'] ? nutriments['vitamin-c_100g'] * 1000 : undefined, // Convert g to mg
            vitaminD: nutriments['vitamin-d_100g'] ? nutriments['vitamin-d_100g'] * 40000 : undefined, // Convert g to IU
            vitaminE: nutriments['vitamin-e_100g'] ? nutriments['vitamin-e_100g'] * 1000 : undefined, // Convert g to mg
            vitaminK: nutriments['vitamin-k_100g'] ? nutriments['vitamin-k_100g'] * 1000000 : undefined, // Convert g to mcg
            thiamine: nutriments['vitamin-b1_100g'] ? nutriments['vitamin-b1_100g'] * 1000 : undefined,
            riboflavin: nutriments['vitamin-b2_100g'] ? nutriments['vitamin-b2_100g'] * 1000 : undefined,
            niacin: nutriments['vitamin-b3_100g'] ? nutriments['vitamin-b3_100g'] * 1000 : undefined,
            vitaminB6: nutriments['vitamin-b6_100g'] ? nutriments['vitamin-b6_100g'] * 1000 : undefined,
            folate: nutriments['vitamin-b9_100g'] ? nutriments['vitamin-b9_100g'] * 1000000 : undefined,
            vitaminB12: nutriments['vitamin-b12_100g'] ? nutriments['vitamin-b12_100g'] * 1000000 : undefined,
            calcium: nutriments['calcium_100g'] ? nutriments['calcium_100g'] * 1000 : undefined,
            iron: nutriments['iron_100g'] ? nutriments['iron_100g'] * 1000 : undefined,
            magnesium: nutriments['magnesium_100g'] ? nutriments['magnesium_100g'] * 1000 : undefined,
            phosphorus: nutriments['phosphorus_100g'] ? nutriments['phosphorus_100g'] * 1000 : undefined,
            potassium: nutriments['potassium_100g'] ? nutriments['potassium_100g'] * 1000 : undefined,
            zinc: nutriments['zinc_100g'] ? nutriments['zinc_100g'] * 1000 : undefined,
            selenium: nutriments['selenium_100g'] ? nutriments['selenium_100g'] * 1000000 : undefined,
            copper: nutriments['copper_100g'] ? nutriments['copper_100g'] * 1000 : undefined,
            manganese: nutriments['manganese_100g'] ? nutriments['manganese_100g'] * 1000 : undefined
        }

        return nutrients
    }

    /**
     * Determine serving size from OpenFoodFacts data
     */
    private static determineServingSize(product: OFFProduct): { servingSize: number; servingUnit: string } {
        // Try to parse serving_size string (e.g., "30g", "1 cup (240ml)")
        if (product.serving_size) {
            const match = product.serving_size.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/)
            if (match) {
                return {
                    servingSize: parseFloat(match[1]),
                    servingUnit: match[2]
                }
            }
        }

        // Try serving_quantity
        if (product.serving_quantity) {
            return {
                servingSize: product.serving_quantity,
                servingUnit: 'g'
            }
        }

        // Default to 100g (since nutrients are per 100g)
        return {
            servingSize: 100,
            servingUnit: 'g'
        }
    }

    /**
     * Clean product name from OpenFoodFacts
     */
    private static cleanProductName(name: string): string {
        if (!name) return 'Unknown Product'

        let cleaned = name
            .trim()
            // Remove excessive whitespace
            .replace(/\s+/g, ' ')
            // Capitalize first letter
            .replace(/^./, str => str.toUpperCase())

        return cleaned
    }

    /**
     * Check if service is available
     */
    static async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.BASE_URL}/api/v2/search?search_terms=apple&page_size=1`)
            return response.ok
        } catch {
            return false
        }
    }
}
