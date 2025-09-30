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
        const { servingSize, servingUnit } = this.determineServingSize(product)
        const nutrients = this.extractNutrients(product.nutriments, servingSize)

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
    private static extractNutrients(nutriments: OFFNutriments, servingSize: number): DetailedNutrients {
        // OpenFoodFacts provides data per 100g and per serving
        // We'll prefer per-serving data when available, then scale per-100g data to serving size

        const hasServingData = nutriments['energy-kcal_serving'] !== undefined

        // Helper to get nutrient value scaled to serving size
        const getNutrient = (per100g?: number, perServing?: number): number | undefined => {
            if (perServing !== undefined) return perServing
            if (per100g !== undefined && servingSize !== 100) {
                return (per100g * servingSize) / 100
            }
            return per100g
        }

        const nutrients: DetailedNutrients = {
            calories: getNutrient(nutriments['energy-kcal_100g'], nutriments['energy-kcal_serving']) || 0,
            carbs: getNutrient(nutriments['carbohydrates_100g'], nutriments['carbohydrates_serving']) || 0,
            protein: getNutrient(nutriments['proteins_100g'], nutriments['proteins_serving']) || 0,
            fats: getNutrient(nutriments['fat_100g'], nutriments['fat_serving']) || 0,
            fiber: getNutrient(nutriments['fiber_100g'], nutriments['fiber_serving']),
            sugar: getNutrient(nutriments['sugars_100g'], nutriments['sugars_serving']),
            sodium: (() => {
                const sodiumG = getNutrient(nutriments['sodium_100g'], nutriments['sodium_serving'])
                return sodiumG ? sodiumG * 1000 : undefined // Convert g to mg
            })(),
            saturatedFat: getNutrient(nutriments['saturated-fat_100g'], nutriments['saturated-fat_serving']),
            transFat: getNutrient(nutriments['trans-fat_100g'], nutriments['trans-fat_serving']),
            monounsaturatedFat: getNutrient(nutriments['monounsaturated-fat_100g']),
            polyunsaturatedFat: getNutrient(nutriments['polyunsaturated-fat_100g']),
            cholesterol: (() => {
                const cholesterolG = getNutrient(nutriments['cholesterol_100g'], nutriments['cholesterol_serving'])
                return cholesterolG ? cholesterolG * 1000 : undefined // Convert g to mg
            })(),
            vitaminA: (() => {
                const vitAG = getNutrient(nutriments['vitamin-a_100g'])
                return vitAG ? vitAG * 1000000 : undefined // Convert g to IU (rough)
            })(),
            vitaminC: (() => {
                const vitCG = getNutrient(nutriments['vitamin-c_100g'])
                return vitCG ? vitCG * 1000 : undefined // Convert g to mg
            })(),
            vitaminD: (() => {
                const vitDG = getNutrient(nutriments['vitamin-d_100g'])
                return vitDG ? vitDG * 40000 : undefined // Convert g to IU
            })(),
            vitaminE: (() => {
                const vitEG = getNutrient(nutriments['vitamin-e_100g'])
                return vitEG ? vitEG * 1000 : undefined // Convert g to mg
            })(),
            vitaminK: (() => {
                const vitKG = getNutrient(nutriments['vitamin-k_100g'])
                return vitKG ? vitKG * 1000000 : undefined // Convert g to mcg
            })(),
            thiamine: (() => {
                const b1G = getNutrient(nutriments['vitamin-b1_100g'])
                return b1G ? b1G * 1000 : undefined
            })(),
            riboflavin: (() => {
                const b2G = getNutrient(nutriments['vitamin-b2_100g'])
                return b2G ? b2G * 1000 : undefined
            })(),
            niacin: (() => {
                const b3G = getNutrient(nutriments['vitamin-b3_100g'])
                return b3G ? b3G * 1000 : undefined
            })(),
            vitaminB6: (() => {
                const b6G = getNutrient(nutriments['vitamin-b6_100g'])
                return b6G ? b6G * 1000 : undefined
            })(),
            folate: (() => {
                const b9G = getNutrient(nutriments['vitamin-b9_100g'])
                return b9G ? b9G * 1000000 : undefined
            })(),
            vitaminB12: (() => {
                const b12G = getNutrient(nutriments['vitamin-b12_100g'])
                return b12G ? b12G * 1000000 : undefined
            })(),
            calcium: (() => {
                const caG = getNutrient(nutriments['calcium_100g'])
                return caG ? caG * 1000 : undefined
            })(),
            iron: (() => {
                const feG = getNutrient(nutriments['iron_100g'])
                return feG ? feG * 1000 : undefined
            })(),
            magnesium: (() => {
                const mgG = getNutrient(nutriments['magnesium_100g'])
                return mgG ? mgG * 1000 : undefined
            })(),
            phosphorus: (() => {
                const pG = getNutrient(nutriments['phosphorus_100g'])
                return pG ? pG * 1000 : undefined
            })(),
            potassium: (() => {
                const kG = getNutrient(nutriments['potassium_100g'])
                return kG ? kG * 1000 : undefined
            })(),
            zinc: (() => {
                const znG = getNutrient(nutriments['zinc_100g'])
                return znG ? znG * 1000 : undefined
            })(),
            selenium: (() => {
                const seG = getNutrient(nutriments['selenium_100g'])
                return seG ? seG * 1000000 : undefined
            })(),
            copper: (() => {
                const cuG = getNutrient(nutriments['copper_100g'])
                return cuG ? cuG * 1000 : undefined
            })(),
            manganese: (() => {
                const mnG = getNutrient(nutriments['manganese_100g'])
                return mnG ? mnG * 1000 : undefined
            })()
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

        const cleaned = name
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
