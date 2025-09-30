// Smart food search with fuzzy matching, intelligent ranking, and multi-field search
import Fuse, { FuseResultMatch } from 'fuse.js'
import { Food } from './nutrition-storage'

export interface SearchResult<T> {
    item: T
    score: number
    highlights: string[]
    matchReasons: string[]
}

interface SearchOptions {
    threshold?: number      // Fuzzy match threshold (0-1, lower = stricter)
    limit?: number         // Max results
    includeScore?: boolean
}

export class SmartFoodSearch {
    private fuse: Fuse<Food>
    private searchHistory: Map<string, number> = new Map() // query → usage count
    private foodUsageCount: Map<string, number> = new Map() // food ID → selection count

    constructor(foods: Food[]) {
        // Configure Fuse.js for intelligent fuzzy matching
        this.fuse = new Fuse(foods, {
            keys: [
                { name: 'name', weight: 10 },           // Highest priority
                { name: 'brand', weight: 7 },
                { name: 'notes', weight: 2 }
            ],
            threshold: 0.4,                             // Allow some fuzziness
            distance: 100,                              // How far to search in the text
            minMatchCharLength: 2,
            includeScore: true,
            includeMatches: true,
            useExtendedSearch: true,
            ignoreLocation: true                        // Match anywhere in string
        })

        // Load search history from localStorage
        this.loadSearchHistory()
        this.loadFoodUsage()
    }

    /**
     * Main search method with intelligent ranking
     */
    search(query: string, options: SearchOptions = {}): SearchResult<Food>[] {
        const {
            threshold = 0.6,
            limit = 200
        } = options

        if (!query || query.trim().length < 2) {
            return []
        }

        const trimmedQuery = query.trim().toLowerCase()

        // Track this search
        this.trackSearch(trimmedQuery)

        // Perform fuzzy search
        const fuseResults = this.fuse.search(trimmedQuery)

        // Convert and enhance results with custom ranking
        const results: SearchResult<Food>[] = fuseResults.map(result => {
            const item = result.item
            const fuseScore = result.score || 0

            // Calculate custom ranking score
            const rankingScore = this.calculateRankingScore(
                item,
                trimmedQuery,
                fuseScore
            )

            // Extract match highlights
            const highlights = this.extractHighlights(result.matches || [])
            const matchReasons = this.getMatchReasons(item, trimmedQuery)

            return {
                item,
                score: rankingScore,
                highlights,
                matchReasons
            }
        })

        // Sort by score (lower is better for fuse.js, but we inverted our custom score)
        const sorted = results.sort((a, b) => b.score - a.score)

        // Filter by threshold and limit
        const filtered = sorted
            .filter(r => r.score >= threshold)
            .slice(0, limit)

        console.log(`Smart search for "${query}": ${filtered.length} results (${fuseResults.length} fuzzy matches)`)

        return filtered
    }

    /**
     * Calculate intelligent ranking score based on multiple factors
     */
    private calculateRankingScore(
        food: Food,
        query: string,
        fuseScore: number
    ): number {
        let score = 0

        const name = food.name.toLowerCase()
        const brand = food.brand?.toLowerCase() || ''
        const queryWords = query.split(' ').filter(w => w.length > 0)

        // Factor 1: Exact match (highest priority)
        if (name === query) {
            score += 100
        }

        // Factor 2: Starts with query
        if (name.startsWith(query)) {
            score += 80
        }

        // Factor 3: Word boundary matches
        queryWords.forEach(word => {
            const regex = new RegExp(`\\b${word}`, 'i')
            if (regex.test(name)) score += 60
            if (regex.test(brand)) score += 40
        })

        // Factor 4: Contains match
        if (name.includes(query)) {
            score += 50
        }
        if (brand.includes(query)) {
            score += 30
        }

        // Factor 5: Fuzzy match quality (invert fuse score: lower fuse score = better match)
        score += (1 - fuseScore) * 40

        // Factor 6: User frequency boost
        const usageCount = this.foodUsageCount.get(food.id) || 0
        if (usageCount > 0) {
            score += Math.min(usageCount * 10, 50) // Max 50 points from frequency
        }

        // Factor 7: Recent usage (check if added in last 7 days)
        const createdDate = new Date(food.createdAt)
        const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceCreated <= 7) {
            score += 20
        }

        // Factor 8: Data completeness
        if (this.hasCompleteNutrition(food)) {
            score += 10
        }

        // Factor 9: User-created foods boost (they're probably more relevant)
        if (food.isUserCreated) {
            score += 15
        }

        return score
    }

    /**
     * Check if food has complete nutrition data
     */
    private hasCompleteNutrition(food: Food): boolean {
        return !!(
            food.macros.carbs > 0 &&
            food.macros.protein > 0 &&
            food.macros.fats > 0 &&
            food.caloriesPerServing > 0
        )
    }

    /**
     * Extract text highlights from Fuse.js matches
     */
    private extractHighlights(matches: readonly FuseResultMatch[]): string[] {
        const highlights: string[] = []

        matches.forEach(match => {
            if (match.value) {
                highlights.push(match.value)
            }
        })

        return highlights
    }

    /**
     * Get human-readable match reasons
     */
    private getMatchReasons(food: Food, query: string): string[] {
        const reasons: string[] = []
        const name = food.name.toLowerCase()
        const brand = food.brand?.toLowerCase() || ''

        if (name === query) {
            reasons.push('Exact match')
        } else if (name.startsWith(query)) {
            reasons.push('Starts with search term')
        } else if (name.includes(query)) {
            reasons.push('Name contains search term')
        }

        if (brand && brand.includes(query)) {
            reasons.push('Brand matches')
        }

        const usageCount = this.foodUsageCount.get(food.id) || 0
        if (usageCount > 3) {
            reasons.push('Frequently used')
        }

        if (food.isUserCreated) {
            reasons.push('Your custom food')
        }

        return reasons
    }

    /**
     * Track search query for analytics
     */
    private trackSearch(query: string): void {
        const count = this.searchHistory.get(query) || 0
        this.searchHistory.set(query, count + 1)

        // Save to localStorage (debounced in real implementation)
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'nutrition-search-history',
                JSON.stringify(Array.from(this.searchHistory.entries()))
            )
        }
    }

    /**
     * Track when user selects a food
     */
    trackFoodSelection(foodId: string): void {
        const count = this.foodUsageCount.get(foodId) || 0
        this.foodUsageCount.set(foodId, count + 1)

        if (typeof window !== 'undefined') {
            localStorage.setItem(
                'nutrition-food-usage',
                JSON.stringify(Array.from(this.foodUsageCount.entries()))
            )
        }
    }

    /**
     * Get recent searches
     */
    getRecentSearches(limit: number = 5): string[] {
        const sorted = Array.from(this.searchHistory.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([query]) => query)

        return sorted
    }

    /**
     * Load search history from localStorage
     */
    private loadSearchHistory(): void {
        if (typeof window === 'undefined') return

        try {
            const stored = localStorage.getItem('nutrition-search-history')
            if (stored) {
                const entries = JSON.parse(stored)
                this.searchHistory = new Map(entries)
            }
        } catch (error) {
            console.error('Error loading search history:', error)
        }
    }

    /**
     * Load food usage data from localStorage
     */
    private loadFoodUsage(): void {
        if (typeof window === 'undefined') return

        try {
            const stored = localStorage.getItem('nutrition-food-usage')
            if (stored) {
                const entries = JSON.parse(stored)
                this.foodUsageCount = new Map(entries)
            }
        } catch (error) {
            console.error('Error loading food usage:', error)
        }
    }

    /**
     * Clear search history
     */
    clearHistory(): void {
        this.searchHistory.clear()
        if (typeof window !== 'undefined') {
            localStorage.removeItem('nutrition-search-history')
        }
    }
}
