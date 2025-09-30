"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NutritionStorage, Food, DetailedNutrients } from "@/lib/nutrition-storage"
import { SmartFoodSearch } from "@/lib/smart-search"
import { Search, X, Plus, Package, Edit3, Calculator, Database, Leaf, ChevronDown, ChevronUp,
         Beef, Wheat, Droplets, AlertTriangle, CheckCircle, Star, Zap, Heart, Shield } from "lucide-react"
import { useNotifications } from "@/lib/contexts/NotificationContext"

interface AddMealDialogProps {
    isOpen: boolean
    onClose: () => void
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
    onFoodAdded: (food: Food, quantity: number, notes?: string) => Promise<void>
}

interface FoodSearchResult {
    id: string
    name: string
    brand?: string
    caloriesPerServing: number
    servingSize: number
    servingUnit: string
    macros: DetailedNutrients
    isUserCreated: boolean
}

export function AddMealDialog({ isOpen, onClose, mealType, onFoodAdded }: AddMealDialogProps) {
    const notifications = useNotifications()

    // Search state
    const [searchQuery, setSearchQuery] = useState("")
    const [searchMode, setSearchMode] = useState<'food' | 'brand'>('food')
    const [brandFilter, setBrandFilter] = useState("")
    const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [availableBrands, setAvailableBrands] = useState<string[]>([])

    // Manual entry state
    const [manualFood, setManualFood] = useState({
        name: "",
        brand: "",
        servingSize: 100,
        servingUnit: "g",
        calories: 0,
        carbs: 0,
        protein: 0,
        fats: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        saturatedFat: 0,
        transFat: 0,
        monounsaturatedFat: 0,
        polyunsaturatedFat: 0,
        cholesterol: 0,
        potassium: 0,
        vitaminA: 0,
        vitaminC: 0,
        calcium: 0,
        iron: 0,
        vitaminD: 0,
        vitaminE: 0,
        vitaminK: 0,
        thiamine: 0,
        riboflavin: 0,
        niacin: 0,
        vitaminB6: 0,
        folate: 0,
        vitaminB12: 0,
        biotin: 0,
        pantothenicAcid: 0,
        phosphorus: 0,
        iodine: 0,
        magnesium: 0,
        zinc: 0,
        selenium: 0,
        copper: 0,
        manganese: 0,
        chromium: 0,
        molybdenum: 0
    })

    // Selected food state
    const [selectedFood, setSelectedFood] = useState<Food | null>(null)
    const [weightGrams, setWeightGrams] = useState(100)
    const [notes, setNotes] = useState("")

    const [activeTab, setActiveTab] = useState<"search" | "manual" | "recent">("search")
    const [showDetailedNutrition, setShowDetailedNutrition] = useState(false)

    const getMealDisplayName = () => {
        const names = {
            breakfast: 'Breakfast',
            lunch: 'Lunch',
            dinner: 'Dinner',
            snacks: 'Snacks'
        }
        return names[mealType]
    }

    // Search for foods with smart search
    useEffect(() => {
        const searchFoods = async () => {
            const trimmedQuery = searchQuery.trim()

            // Clear results if query is too short
            if (trimmedQuery.length < 2) {
                setSearchResults([])
                setAvailableBrands([])
                setBrandFilter("") // Reset brand filter when search is cleared
                setIsSearching(false)
                return
            }

            setIsSearching(true)
            try {
                // Fetch all foods without limit (for local search)
                const foods = await NutritionStorage.getFoods(trimmedQuery, 200)

                console.log(`Fetched ${foods.length} foods for query "${trimmedQuery}"`)

                // Initialize smart search with all foods
                const smartSearch = new SmartFoodSearch(foods)

                // Perform intelligent fuzzy search
                const smartResults = smartSearch.search(trimmedQuery, {
                    threshold: 0.3,  // Lower threshold = more permissive
                    limit: 200
                })

                console.log(`Smart search found ${smartResults.length} matches`)

                // Apply brand filtering if in brand search mode
                let filteredResults = smartResults
                if (searchMode === 'brand') {
                    filteredResults = smartResults.filter(result =>
                        result.item.brand && result.item.brand.toLowerCase().includes(trimmedQuery.toLowerCase())
                    )
                    console.log(`Brand search mode: ${filteredResults.length} foods with matching brands`)
                }

                // Extract unique brands from results
                const brands = [...new Set(
                    filteredResults
                        .map(r => r.item)
                        .filter(food => food.brand)
                        .map(food => food.brand!)
                )].sort()
                setAvailableBrands(brands)

                // Apply brand filter if selected (but not "all")
                if (brandFilter && brandFilter !== 'all') {
                    const beforeFilter = filteredResults.length
                    filteredResults = filteredResults.filter(result => result.item.brand === brandFilter)
                    console.log(`Brand filter "${brandFilter}": ${beforeFilter} → ${filteredResults.length} foods`)
                }

                console.log(`Final results: ${filteredResults.length} foods to display`)

                // Convert to search results format
                setSearchResults(filteredResults.map(result => ({
                    id: result.item.id,
                    name: result.item.name,
                    brand: result.item.brand,
                    caloriesPerServing: result.item.caloriesPerServing,
                    servingSize: result.item.servingSize,
                    servingUnit: result.item.servingUnit,
                    macros: result.item.macros,
                    isUserCreated: result.item.isUserCreated
                })))
            } catch (error) {
                console.error('Error searching foods:', error)
                setSearchResults([])
            } finally {
                setIsSearching(false)
            }
        }

        // Only debounce if we have enough characters
        if (searchQuery.trim().length >= 2) {
            const debounceTimer = setTimeout(searchFoods, 400) // Slightly faster since smart search is efficient
            return () => clearTimeout(debounceTimer)
        } else {
            // Immediately clear if query is too short
            searchFoods()
        }
    }, [searchQuery, searchMode, brandFilter])

    const handleFoodSelect = (foodResult: FoodSearchResult) => {
        const food: Food = {
            id: foodResult.id,
            name: foodResult.name,
            brand: foodResult.brand,
            servingSize: foodResult.servingSize,
            servingUnit: foodResult.servingUnit,
            caloriesPerServing: foodResult.caloriesPerServing,
            macros: foodResult.macros,
            isUserCreated: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setSelectedFood(food)
        setWeightGrams(food.servingSize) // Set to default serving size in grams
        setNotes("")
    }

    const handleManualSave = async () => {
        if (!manualFood.name.trim()) {
            notifications.warning('Missing information', {
                description: 'Please enter a food name',
                duration: 3000
            })
            return
        }

        try {
            const detailedNutrients: DetailedNutrients = {
                carbs: manualFood.carbs,
                protein: manualFood.protein,
                fats: manualFood.fats,
                fiber: manualFood.fiber || undefined,
                sugar: manualFood.sugar || undefined,
                sodium: manualFood.sodium || undefined,
                saturatedFat: manualFood.saturatedFat || undefined,
                transFat: manualFood.transFat || undefined,
                monounsaturatedFat: manualFood.monounsaturatedFat || undefined,
                polyunsaturatedFat: manualFood.polyunsaturatedFat || undefined,
                cholesterol: manualFood.cholesterol || undefined,
                potassium: manualFood.potassium || undefined,
                vitaminA: manualFood.vitaminA || undefined,
                vitaminC: manualFood.vitaminC || undefined,
                calcium: manualFood.calcium || undefined,
                iron: manualFood.iron || undefined,
                vitaminD: manualFood.vitaminD || undefined,
                vitaminE: manualFood.vitaminE || undefined,
                vitaminK: manualFood.vitaminK || undefined,
                thiamine: manualFood.thiamine || undefined,
                riboflavin: manualFood.riboflavin || undefined,
                niacin: manualFood.niacin || undefined,
                vitaminB6: manualFood.vitaminB6 || undefined,
                folate: manualFood.folate || undefined,
                vitaminB12: manualFood.vitaminB12 || undefined,
                biotin: manualFood.biotin || undefined,
                pantothenicAcid: manualFood.pantothenicAcid || undefined,
                phosphorus: manualFood.phosphorus || undefined,
                iodine: manualFood.iodine || undefined,
                magnesium: manualFood.magnesium || undefined,
                zinc: manualFood.zinc || undefined,
                selenium: manualFood.selenium || undefined,
                copper: manualFood.copper || undefined,
                manganese: manualFood.manganese || undefined,
                chromium: manualFood.chromium || undefined,
                molybdenum: manualFood.molybdenum || undefined
            }

            const food = await NutritionStorage.saveFood({
                name: manualFood.name.trim(),
                brand: manualFood.brand.trim() || undefined,
                servingSize: manualFood.servingSize,
                servingUnit: manualFood.servingUnit,
                caloriesPerServing: manualFood.calories,
                macros: detailedNutrients,
                isUserCreated: true
            })

            const servingMultiplier = weightGrams / food.servingSize
            await onFoodAdded(food, servingMultiplier, notes.trim() || undefined)

            notifications.success('Food added', {
                description: `${food.name} has been added to ${getMealDisplayName()}`,
                duration: 3000
            })

            handleClose()
        } catch (error) {
            console.error('Error saving manual food:', error)
            notifications.error('Save failed', {
                description: 'Unable to save food. Please try again.',
                duration: 4000
            })
        }
    }

    const handleSelectedFoodSave = async () => {
        if (!selectedFood) return

        try {
            const servingMultiplier = weightGrams / selectedFood.servingSize
            await onFoodAdded(selectedFood, servingMultiplier, notes.trim() || undefined)

            notifications.success('Food added', {
                description: `${selectedFood.name} has been added to ${getMealDisplayName()}`,
                duration: 3000
            })

            handleClose()
        } catch (error) {
            console.error('Error adding selected food:', error)
            notifications.error('Add failed', {
                description: 'Unable to add food. Please try again.',
                duration: 4000
            })
        }
    }

    const handleClose = () => {
        setSearchQuery("")
        setSearchMode('food')
        setBrandFilter("")
        setSearchResults([])
        setAvailableBrands([])
        setSelectedFood(null)
        setWeightGrams(100)
        setNotes("")
        setManualFood({
            name: "",
            brand: "",
            servingSize: 100,
            servingUnit: "g",
            calories: 0,
            carbs: 0,
            protein: 0,
            fats: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            saturatedFat: 0,
            transFat: 0,
            monounsaturatedFat: 0,
            polyunsaturatedFat: 0,
            cholesterol: 0,
            potassium: 0,
            vitaminA: 0,
            vitaminC: 0,
            calcium: 0,
            iron: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            thiamine: 0,
            riboflavin: 0,
            niacin: 0,
            vitaminB6: 0,
            folate: 0,
            vitaminB12: 0,
            biotin: 0,
            pantothenicAcid: 0,
            phosphorus: 0,
            iodine: 0,
            magnesium: 0,
            zinc: 0,
            selenium: 0,
            copper: 0,
            manganese: 0,
            chromium: 0,
            molybdenum: 0
        })
        setActiveTab("search")
        onClose()
    }

    // Helper function to format numbers to 1 decimal place, removing .0 for whole numbers
    const formatNutrientValue = (value: number): string => {
        const rounded = Math.round(value * 10) / 10
        return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1)
    }

    const calculateAdjustedNutrition = (food: Food | typeof manualFood, weightG: number) => {
        const isFood = 'caloriesPerServing' in food
        const servingSize = isFood ? food.servingSize : manualFood.servingSize
        const multiplier = weightG / servingSize

        const calories = isFood ? food.caloriesPerServing : food.calories
        const carbs = isFood ? food.macros.carbs : food.carbs
        const protein = isFood ? food.macros.protein : food.protein
        const fats = isFood ? food.macros.fats : food.fats

        return {
            calories: Math.round(calories * multiplier),
            carbs: formatNutrientValue(carbs * multiplier),
            protein: formatNutrientValue(protein * multiplier),
            fats: formatNutrientValue(fats * multiplier)
        }
    }

    const hasDetailedNutrients = (macros: DetailedNutrients) => {
        return !!(
            // Basic detailed nutrients
            macros.fiber || macros.sugar || macros.sodium ||
            // Fats breakdown
            macros.saturatedFat || macros.transFat || macros.monounsaturatedFat ||
            macros.polyunsaturatedFat || macros.cholesterol ||
            // Vitamins (fat-soluble)
            macros.vitaminA || macros.vitaminD || macros.vitaminE || macros.vitaminK ||
            // Vitamins (water-soluble)
            macros.vitaminC || macros.thiamine || macros.riboflavin || macros.niacin ||
            macros.vitaminB6 || macros.folate || macros.vitaminB12 || macros.biotin ||
            macros.pantothenicAcid ||
            // Major minerals
            macros.calcium || macros.iron || macros.potassium || macros.phosphorus ||
            macros.magnesium ||
            // Trace minerals
            macros.zinc || macros.selenium || macros.copper || macros.manganese ||
            macros.iodine || macros.chromium || macros.molybdenum
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[#0B0B0F] border border-[#212227] text-[#F3F4F6] max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-semibold text-[#F3F4F6]">
                            Add to {getMealDisplayName()}
                        </DialogTitle>
                        <Button
                            onClick={handleClose}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                    <DialogDescription className="sr-only">
                        Search for foods from USDA database, add them manually, or select from recent foods to add to your meal
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
                    <TabsList className="grid w-full grid-cols-3 bg-[#121318] border border-[#212227]">
                        <TabsTrigger value="search" className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white">
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white">
                            <Edit3 className="w-4 h-4 mr-2" />
                            Manual Entry
                        </TabsTrigger>
                        <TabsTrigger value="recent" className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white">
                            <Package className="w-4 h-4 mr-2" />
                            Recent
                        </TabsTrigger>
                    </TabsList>

                    {/* Search Tab */}
                    <TabsContent value="search" className="space-y-4">
                        {/* Search Bar and Filter on Same Row */}
                        <div className="flex items-center gap-2">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-4 h-4" />
                                <Input
                                    placeholder={searchMode === 'food' ? "Search foods (e.g., 'chicken breast', 'banana')..." : "Search by brand (e.g., 'Quest', 'KIND')..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86]"
                                />
                            </div>

                            {/* Brand Filter - Right Side */}
                            {availableBrands.length > 0 && (
                                <div className="flex items-center gap-2 w-64 shrink-0">
                                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                                        <SelectTrigger className="bg-[#121318] border-[#212227] text-[#F3F4F6]">
                                            <SelectValue placeholder="All brands..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#121318] border-[#212227] text-[#F3F4F6]">
                                            <SelectItem value="all" className="hover:bg-[#212227]">
                                                <span className="text-[#F3F4F6]">All Brands</span>
                                            </SelectItem>
                                            {availableBrands.map((brand) => (
                                                <SelectItem key={brand} value={brand} className="hover:bg-[#212227]">
                                                    <span className="text-[#F3F4F6]">{brand}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {brandFilter && brandFilter !== 'all' && (
                                        <Button
                                            onClick={() => setBrandFilter("")}
                                            variant="ghost"
                                            size="icon"
                                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] shrink-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Results Counter */}
                        {searchResults.length > 0 && (
                            <div className="flex items-center justify-between text-xs px-1 py-2 bg-[#121318] border border-[#212227] rounded-lg">
                                <span className="text-[#F3F4F6] font-medium">
                                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                                    {searchMode === 'brand' && (
                                        <span className="text-[#2A8CEA]"> · searching brands</span>
                                    )}
                                    {brandFilter && brandFilter !== 'all' && (
                                        <span className="text-[#2A8CEA]"> · filtered by {brandFilter}</span>
                                    )}
                                </span>
                                {availableBrands.length > 1 && (
                                    <span className="text-[#7A7F86]">{availableBrands.length} brand{availableBrands.length !== 1 ? 's' : ''} found</span>
                                )}
                            </div>
                        )}

                        {/* Search Results */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {isSearching ? (
                                <div className="text-center py-8">
                                    <div className="w-6 h-6 border-2 border-[#2A8CEA] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                    <p className="text-[#A1A1AA] text-sm">Searching...</p>
                                </div>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((food) => {
                                    const isUSDAFood = food.id.startsWith('usda-')
                                    const isOFFFood = food.id.startsWith('off-')
                                    const isCNFFood = food.id.startsWith('cnf-')
                                    const isUserFood = food.isUserCreated

                                    return (
                                        <div
                                            key={food.id}
                                            onClick={() => handleFoodSelect(food)}
                                            className="p-3 bg-[#121318] border border-[#212227] rounded-lg hover:border-[#2A2B31] cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h4 className="font-medium text-[#F3F4F6]">{food.name}</h4>
                                                        {isUSDAFood && (
                                                            <Badge variant="outline" className="text-[#9BE15D] border-[#9BE15D]/30 bg-[#9BE15D]/10 text-xs">
                                                                <Leaf className="w-3 h-3 mr-1" />
                                                                USDA
                                                            </Badge>
                                                        )}
                                                        {isOFFFood && (
                                                            <Badge variant="outline" className="text-[#FF9500] border-[#FF9500]/30 bg-[#FF9500]/10 text-xs">
                                                                <Package className="w-3 h-3 mr-1" />
                                                                OFF
                                                            </Badge>
                                                        )}
                                                        {isCNFFood && (
                                                            <Badge variant="outline" className="text-[#FF375F] border-[#FF375F]/30 bg-[#FF375F]/10 text-xs">
                                                                <Leaf className="w-3 h-3 mr-1" />
                                                                CNF
                                                            </Badge>
                                                        )}
                                                        {isUserFood && (
                                                            <Badge variant="outline" className="text-[#2A8CEA] border-[#2A8CEA]/30 bg-[#2A8CEA]/10 text-xs">
                                                                <Star className="w-3 h-3 mr-1" />
                                                                Custom
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {food.brand && (
                                                        <p className="text-xs text-[#A1A1AA] mb-1">{food.brand}</p>
                                                    )}
                                                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-[#7A7F86]">
                                                        <span className="font-medium text-[#F3F4F6]">{food.caloriesPerServing} cal</span>
                                                        <span className="text-[#9BE15D]">{formatNutrientValue(food.macros.carbs)}g carbs</span>
                                                        <span className="text-[#2A8CEA]">{formatNutrientValue(food.macros.protein)}g protein</span>
                                                        <span className="text-[#FF2D55]">{formatNutrientValue(food.macros.fats)}g fats</span>
                                                        {food.macros.fiber && food.macros.fiber > 0 && (
                                                            <span className="text-[#00E676]">{formatNutrientValue(food.macros.fiber)}g fiber</span>
                                                        )}
                                                        {food.macros.sugar && food.macros.sugar > 0 && (
                                                            <span className="text-[#FF6B6B]">{formatNutrientValue(food.macros.sugar)}g sugar</span>
                                                        )}
                                                        {food.macros.sodium && food.macros.sodium > 0 && (
                                                            <span className="text-[#A1A1AA]">{formatNutrientValue(food.macros.sodium)}mg sodium</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="text-[#A1A1AA] border-[#212227] ml-2">
                                                    per {food.servingSize}{food.servingUnit}
                                                </Badge>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : searchQuery.length >= 2 ? (
                                <div className="text-center py-8 px-4">
                                    <Database className="w-12 h-12 text-[#2A2B31] mx-auto mb-3" />
                                    <p className="text-[#F3F4F6] font-medium mb-2">No foods found for &ldquo;{searchQuery}&rdquo;</p>
                                    <div className="text-[#7A7F86] text-sm space-y-1 mb-4">
                                        <p>• Try different keywords (e.g., &ldquo;chocolate&rdquo; instead of &ldquo;choco&rdquo;)</p>
                                        <p>• Check your spelling</p>
                                        {searchMode === 'brand' && <p>• Switch to &ldquo;Food Name&rdquo; search mode</p>}
                                        {brandFilter && brandFilter !== 'all' && <p>• Clear the brand filter to see more results</p>}
                                        <p>• USDA API may be temporarily unavailable</p>
                                    </div>
                                    <Button
                                        onClick={() => setActiveTab('manual')}
                                        variant="outline"
                                        className="bg-[#121318] border-[#2A8CEA] text-[#2A8CEA] hover:bg-[#2A8CEA] hover:text-white"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Manually Instead
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="flex items-center justify-center space-x-2 mb-3">
                                        <Search className="w-8 h-8 text-[#A1A1AA]" />
                                        <Leaf className="w-6 h-6 text-[#9BE15D]" />
                                    </div>
                                    <p className="text-[#A1A1AA] text-sm font-medium">Search USDA Food Database</p>
                                    <p className="text-[#7A7F86] text-xs mt-1">Enter at least 2 characters to find foods with complete nutrition facts</p>
                                    <div className="flex items-center justify-center space-x-4 mt-3 text-xs text-[#7A7F86]">
                                        <span className="flex items-center">
                                            <Leaf className="w-3 h-3 mr-1 text-[#9BE15D]" />
                                            USDA verified
                                        </span>
                                        <span className="flex items-center">
                                            <Database className="w-3 h-3 mr-1 text-[#2A8CEA]" />
                                            Your custom foods
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Manual Entry Tab */}
                    <TabsContent value="manual" className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Food Name *</Label>
                                <Input
                                    placeholder="e.g., Grilled Chicken Breast"
                                    value={manualFood.name}
                                    onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                                    className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86]"
                                />
                            </div>
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Brand (Optional)</Label>
                                <Input
                                    placeholder="e.g., Tyson"
                                    value={manualFood.brand}
                                    onChange={(e) => setManualFood({ ...manualFood, brand: e.target.value })}
                                    className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Serving Size</Label>
                                <div className="flex space-x-2">
                                    <Input
                                        type="number"
                                        value={manualFood.servingSize}
                                        onChange={(e) => setManualFood({ ...manualFood, servingSize: Number(e.target.value) })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="0"
                                        step="0.1"
                                    />
                                    <Input
                                        placeholder="g, ml, cup..."
                                        value={manualFood.servingUnit}
                                        onChange={(e) => setManualFood({ ...manualFood, servingUnit: e.target.value })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6] w-24"
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Calories per Serving</Label>
                                <Input
                                    type="number"
                                    value={manualFood.calories}
                                    onChange={(e) => setManualFood({ ...manualFood, calories: Number(e.target.value) })}
                                    className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Macronutrients */}
                        <div>
                            <h4 className="text-[#F3F4F6] font-medium mb-3">Macronutrients (grams)</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-[#A1A1AA] text-sm">Carbs</Label>
                                    <Input
                                        type="number"
                                        value={manualFood.carbs}
                                        onChange={(e) => setManualFood({ ...manualFood, carbs: Number(e.target.value) })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[#A1A1AA] text-sm">Protein</Label>
                                    <Input
                                        type="number"
                                        value={manualFood.protein}
                                        onChange={(e) => setManualFood({ ...manualFood, protein: Number(e.target.value) })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[#A1A1AA] text-sm">Fats</Label>
                                    <Input
                                        type="number"
                                        value={manualFood.fats}
                                        onChange={(e) => setManualFood({ ...manualFood, fats: Number(e.target.value) })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="0"
                                        step="0.1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Optional Details */}
                        <details className="border border-[#212227] rounded-lg">
                            <summary className="p-3 cursor-pointer text-[#A1A1AA] hover:text-[#F3F4F6] transition-colors">
                                Optional Detailed Nutrition
                            </summary>
                            <div className="p-3 pt-0 space-y-4">
                                {/* Extended Macros */}
                                <div>
                                    <h5 className="text-[#F3F4F6] text-sm font-medium mb-2">Extended Macros</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Fiber (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.fiber}
                                                onChange={(e) => setManualFood({ ...manualFood, fiber: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Sugar (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.sugar}
                                                onChange={(e) => setManualFood({ ...manualFood, sugar: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Saturated Fat (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.saturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, saturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Trans Fat (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.transFat}
                                                onChange={(e) => setManualFood({ ...manualFood, transFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Monounsaturated Fat (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.monounsaturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, monounsaturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Polyunsaturated Fat (g)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.polyunsaturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, polyunsaturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Cholesterol (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.cholesterol}
                                                onChange={(e) => setManualFood({ ...manualFood, cholesterol: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Sodium (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.sodium}
                                                onChange={(e) => setManualFood({ ...manualFood, sodium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Potassium (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.potassium}
                                                onChange={(e) => setManualFood({ ...manualFood, potassium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Vitamins */}
                                <div>
                                    <h5 className="text-[#F3F4F6] text-sm font-medium mb-2">Vitamins</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin A (IU)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminA}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminA: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin C (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminC}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminC: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin D (IU)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminD}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminD: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin E (IU)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminE}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminE: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin K (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminK}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminK: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Thiamine B1 (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.thiamine}
                                                onChange={(e) => setManualFood({ ...manualFood, thiamine: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Riboflavin B2 (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.riboflavin}
                                                onChange={(e) => setManualFood({ ...manualFood, riboflavin: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Niacin B3 (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.niacin}
                                                onChange={(e) => setManualFood({ ...manualFood, niacin: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin B6 (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminB6}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminB6: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Folate B9 (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.folate}
                                                onChange={(e) => setManualFood({ ...manualFood, folate: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Vitamin B12 (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.vitaminB12}
                                                onChange={(e) => setManualFood({ ...manualFood, vitaminB12: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Biotin (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.biotin}
                                                onChange={(e) => setManualFood({ ...manualFood, biotin: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Pantothenic Acid B5 (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.pantothenicAcid}
                                                onChange={(e) => setManualFood({ ...manualFood, pantothenicAcid: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Minerals */}
                                <div>
                                    <h5 className="text-[#F3F4F6] text-sm font-medium mb-2">Minerals</h5>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Calcium (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.calcium}
                                                onChange={(e) => setManualFood({ ...manualFood, calcium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Iron (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.iron}
                                                onChange={(e) => setManualFood({ ...manualFood, iron: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Phosphorus (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.phosphorus}
                                                onChange={(e) => setManualFood({ ...manualFood, phosphorus: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Iodine (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.iodine}
                                                onChange={(e) => setManualFood({ ...manualFood, iodine: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Magnesium (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.magnesium}
                                                onChange={(e) => setManualFood({ ...manualFood, magnesium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Zinc (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.zinc}
                                                onChange={(e) => setManualFood({ ...manualFood, zinc: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Selenium (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.selenium}
                                                onChange={(e) => setManualFood({ ...manualFood, selenium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Copper (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.copper}
                                                onChange={(e) => setManualFood({ ...manualFood, copper: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Manganese (mg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.manganese}
                                                onChange={(e) => setManualFood({ ...manualFood, manganese: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Chromium (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.chromium}
                                                onChange={(e) => setManualFood({ ...manualFood, chromium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm">Molybdenum (mcg)</Label>
                                            <Input
                                                type="number"
                                                value={manualFood.molybdenum}
                                                onChange={(e) => setManualFood({ ...manualFood, molybdenum: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                                min="0"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </details>
                    </TabsContent>

                    {/* Recent Foods Tab */}
                    <TabsContent value="recent" className="space-y-4">
                        <div className="text-center py-12">
                            <Package className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
                            <p className="text-[#A1A1AA] text-lg font-medium">Recent foods coming soon</p>
                            <p className="text-[#7A7F86] text-sm mt-2">Your recently used foods will appear here</p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Food Selection Section */}
                {selectedFood && (
                    <div className="border-t border-[#212227] pt-4">
                        <h4 className="text-[#F3F4F6] font-medium mb-3">Selected: {selectedFood.name}</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Weight/Amount</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        type="number"
                                        value={weightGrams}
                                        onChange={(e) => setWeightGrams(Math.max(1, Number(e.target.value)))}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="1"
                                        step="1"
                                    />
                                    <span className="text-[#A1A1AA] text-sm whitespace-nowrap">
                                        grams (1 serving = {selectedFood.servingSize}g)
                                    </span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-[#F3F4F6] text-sm font-medium">Notes (Optional)</Label>
                                <Input
                                    placeholder="e.g., with olive oil..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86]"
                                />
                            </div>
                        </div>

                        {/* Nutrition Preview */}
                        <div className="bg-[#121318] border border-[#212227] rounded-lg p-4 mb-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                    <Calculator className="w-4 h-4 text-[#2A8CEA]" />
                                    <h5 className="text-[#F3F4F6] font-medium">Nutrition for {weightGrams}g ({formatNutrientValue(weightGrams / selectedFood.servingSize)} serving{(weightGrams / selectedFood.servingSize) !== 1 ? 's' : ''})</h5>
                                    {selectedFood.id.startsWith('usda-') && (
                                        <Badge variant="outline" className="text-[#9BE15D] border-[#9BE15D]/30 bg-[#9BE15D]/10 text-xs">
                                            <Leaf className="w-3 h-3 mr-1" />
                                            USDA Data
                                        </Badge>
                                    )}
                                </div>
                                {hasDetailedNutrients(selectedFood.macros) && (
                                    <button
                                        onClick={() => setShowDetailedNutrition(!showDetailedNutrition)}
                                        className="flex items-center text-xs text-[#2A8CEA] hover:text-[#4AA7FF] transition-colors"
                                    >
                                        {showDetailedNutrition ? 'Hide Details' : 'Show Details'}
                                        {showDetailedNutrition ? (
                                            <ChevronUp className="w-3 h-3 ml-1" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3 ml-1" />
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Main Macros */}
                            <div className="grid grid-cols-4 gap-4 text-center mb-4">
                                <div>
                                    <div className="text-xl font-bold text-[#F3F4F6]">
                                        {calculateAdjustedNutrition(selectedFood, weightGrams).calories}
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">calories</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#9BE15D]">
                                        {calculateAdjustedNutrition(selectedFood, weightGrams).carbs}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">carbs</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#2A8CEA]">
                                        {calculateAdjustedNutrition(selectedFood, weightGrams).protein}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">protein</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#FF2D55]">
                                        {calculateAdjustedNutrition(selectedFood, weightGrams).fats}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">fats</div>
                                </div>
                            </div>

                            {/* Detailed Nutrition Panel */}
                            {showDetailedNutrition && hasDetailedNutrients(selectedFood.macros) && (
                                <div className="border-t border-[#212227] pt-4 mt-3">
                                    <div className="flex items-center justify-between mb-4">
                                        <h6 className="text-sm font-medium text-[#F3F4F6]">Detailed Nutrition</h6>
                                        <div className="flex items-center space-x-2">
                                            {/* Health Score Badge */}
                                            {(() => {
                                                let score = 0
                                                let maxScore = 0

                                                // Complete protein bonus
                                                if (selectedFood.macros.protein > 0) {
                                                    maxScore += 2
                                                    const isComplete = selectedFood.name.toLowerCase().includes('meat') ||
                                                                     selectedFood.name.toLowerCase().includes('fish') ||
                                                                     selectedFood.name.toLowerCase().includes('chicken') ||
                                                                     selectedFood.name.toLowerCase().includes('egg') ||
                                                                     selectedFood.name.toLowerCase().includes('quinoa') ||
                                                                     selectedFood.name.toLowerCase().includes('soy')
                                                    if (isComplete) score += 2
                                                    else score += 1
                                                }

                                                // Fiber bonus
                                                if (selectedFood.macros.fiber && selectedFood.macros.fiber > 0) {
                                                    maxScore += 2
                                                    if (selectedFood.macros.fiber >= 3) score += 2
                                                    else if (selectedFood.macros.fiber >= 1) score += 1
                                                }

                                                // Low sugar bonus
                                                if (selectedFood.macros.carbs > 0) {
                                                    maxScore += 1
                                                    const sugarRatio = (selectedFood.macros.sugar || 0) / selectedFood.macros.carbs
                                                    if (sugarRatio < 0.1) score += 1
                                                    else if (sugarRatio < 0.3) score += 0.5
                                                }

                                                // Saturated fat penalty
                                                if (selectedFood.macros.saturatedFat && selectedFood.macros.saturatedFat > 0) {
                                                    maxScore += 1
                                                    if (selectedFood.macros.saturatedFat < 2) score += 1
                                                    else if (selectedFood.macros.saturatedFat < 5) score += 0.5
                                                }

                                                // Trans fat penalty
                                                if (selectedFood.macros.transFat && selectedFood.macros.transFat > 0) {
                                                    score -= 2
                                                }

                                                maxScore = Math.max(maxScore, 1)
                                                const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100))

                                                let badgeText = 'Poor'
                                                if (percentage >= 80) {
                                                    badgeText = 'Excellent'
                                                } else if (percentage >= 60) {
                                                    badgeText = 'Good'
                                                } else if (percentage >= 40) {
                                                    badgeText = 'Fair'
                                                }

                                                return (
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            variant={
                                                                percentage >= 80 ? "default" :
                                                                percentage >= 60 ? "secondary" :
                                                                percentage >= 40 ? "outline" : "destructive"
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {percentage >= 80 && <Star className="w-3 h-3 mr-1" />}
                                                            {percentage >= 60 && percentage < 80 && <CheckCircle className="w-3 h-3 mr-1" />}
                                                            {percentage >= 40 && percentage < 60 && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                            {percentage < 40 && <X className="w-3 h-3 mr-1" />}
                                                            {badgeText}
                                                        </Badge>
                                                        <div className="text-xs text-[#7A7F86]">
                                                            {Math.round(percentage)}%
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    </div>

                                    {/* Essential Nutrients */}
                                    {selectedFood.macros.sodium && selectedFood.macros.sodium > 0 && (
                                        <div className="text-center text-sm mb-4">
                                            <div>
                                                <div className="font-semibold text-[#A1A1AA]">
                                                    {formatNutrientValue(selectedFood.macros.sodium * (weightGrams / selectedFood.servingSize))}mg
                                                </div>
                                                <div className="text-xs text-[#7A7F86]">sodium</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Protein Quality Breakdown */}
                                    {selectedFood.macros.protein > 0 && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Beef className="w-4 h-4 text-[#2A8CEA]" />
                                                    <h6 className="text-xs font-medium text-[#2A8CEA]">Proteins</h6>
                                                </div>
                                                {(() => {
                                                    const isComplete = selectedFood.name.toLowerCase().includes('meat') ||
                                                                     selectedFood.name.toLowerCase().includes('fish') ||
                                                                     selectedFood.name.toLowerCase().includes('chicken') ||
                                                                     selectedFood.name.toLowerCase().includes('turkey') ||
                                                                     selectedFood.name.toLowerCase().includes('beef') ||
                                                                     selectedFood.name.toLowerCase().includes('pork') ||
                                                                     selectedFood.name.toLowerCase().includes('lamb') ||
                                                                     selectedFood.name.toLowerCase().includes('egg') ||
                                                                     selectedFood.name.toLowerCase().includes('milk') ||
                                                                     selectedFood.name.toLowerCase().includes('cheese') ||
                                                                     selectedFood.name.toLowerCase().includes('yogurt') ||
                                                                     selectedFood.name.toLowerCase().includes('whey') ||
                                                                     selectedFood.name.toLowerCase().includes('casein') ||
                                                                     selectedFood.name.toLowerCase().includes('quinoa') ||
                                                                     selectedFood.name.toLowerCase().includes('soy') ||
                                                                     selectedFood.name.toLowerCase().includes('tofu') ||
                                                                     selectedFood.name.toLowerCase().includes('tempeh')
                                                    return (
                                                        <Badge
                                                            variant={isComplete ? "default" : "secondary"}
                                                            className="text-xs"
                                                        >
                                                            {isComplete ? <Star className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                                            {isComplete ? 'Complete' : 'Incomplete'}
                                                        </Badge>
                                                    )
                                                })()}
                                            </div>

                                            <div className="space-y-3">
                                                {/* Complete Proteins */}
                                                {(() => {
                                                    const totalProtein = selectedFood.macros.protein * (weightGrams / selectedFood.servingSize)

                                                    if (totalProtein <= 0) return null

                                                    const hasCompleteProtein = selectedFood.name.toLowerCase().includes('meat') ||
                                                                              selectedFood.name.toLowerCase().includes('fish') ||
                                                                              selectedFood.name.toLowerCase().includes('chicken') ||
                                                                              selectedFood.name.toLowerCase().includes('turkey') ||
                                                                              selectedFood.name.toLowerCase().includes('beef') ||
                                                                              selectedFood.name.toLowerCase().includes('pork') ||
                                                                              selectedFood.name.toLowerCase().includes('lamb') ||
                                                                              selectedFood.name.toLowerCase().includes('egg') ||
                                                                              selectedFood.name.toLowerCase().includes('milk') ||
                                                                              selectedFood.name.toLowerCase().includes('cheese') ||
                                                                              selectedFood.name.toLowerCase().includes('yogurt') ||
                                                                              selectedFood.name.toLowerCase().includes('whey') ||
                                                                              selectedFood.name.toLowerCase().includes('casein') ||
                                                                              selectedFood.name.toLowerCase().includes('quinoa') ||
                                                                              selectedFood.name.toLowerCase().includes('soy') ||
                                                                              selectedFood.name.toLowerCase().includes('tofu') ||
                                                                              selectedFood.name.toLowerCase().includes('tempeh')

                                                    const hasIncompleteProtein = selectedFood.name.toLowerCase().includes('rice') ||
                                                                                selectedFood.name.toLowerCase().includes('bean') ||
                                                                                selectedFood.name.toLowerCase().includes('lentil') ||
                                                                                selectedFood.name.toLowerCase().includes('pea') ||
                                                                                selectedFood.name.toLowerCase().includes('nut') ||
                                                                                selectedFood.name.toLowerCase().includes('seed') ||
                                                                                selectedFood.name.toLowerCase().includes('wheat') ||
                                                                                selectedFood.name.toLowerCase().includes('oat') ||
                                                                                selectedFood.name.toLowerCase().includes('corn') ||
                                                                                (!hasCompleteProtein && totalProtein > 0)

                                                    // For mixed foods, estimate distribution
                                                    const completeProtein = hasCompleteProtein ?
                                                        (hasIncompleteProtein ? totalProtein * 0.7 : totalProtein) : 0
                                                    const incompleteProtein = hasIncompleteProtein ?
                                                        (hasCompleteProtein ? totalProtein * 0.3 : totalProtein) : 0

                                                    return (
                                                        <>
                                                            {/* Complete Proteins */}
                                                            {completeProtein > 0.1 && (
                                                                <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <CheckCircle className="w-4 h-4 text-[#00E676]" />
                                                                            <span className="text-sm font-medium text-[#F3F4F6]">Complete Proteins</span>
                                                                        </div>
                                                                        <span className="text-lg font-bold text-[#2A8CEA]">
                                                                            {formatNutrientValue(completeProtein)}g
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-[#7A7F86]">Contains all essential amino acids</div>
                                                                </div>
                                                            )}

                                                            {/* Incomplete Proteins */}
                                                            {incompleteProtein > 0.1 && (
                                                                <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <div className="flex items-center space-x-2">
                                                                            <AlertTriangle className="w-4 h-4 text-[#FFA500]" />
                                                                            <span className="text-sm font-medium text-[#F3F4F6]">Incomplete Proteins</span>
                                                                        </div>
                                                                        <span className="text-lg font-bold text-[#2A8CEA]">
                                                                            {formatNutrientValue(incompleteProtein)}g
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xs text-[#7A7F86]">Combine with other proteins for complete amino acid profile</div>
                                                                </div>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Carbohydrates Quality Breakdown */}
                                    {((selectedFood.macros.sugar && selectedFood.macros.sugar > 0) ||
                                      (selectedFood.macros.carbs - (selectedFood.macros.sugar || 0) - (selectedFood.macros.fiber || 0)) > 0 ||
                                      (selectedFood.macros.fiber && selectedFood.macros.fiber > 0) ||
                                      ((selectedFood.macros.carbs - (selectedFood.macros.sugar || 0) - (selectedFood.macros.fiber || 0)) > 0 &&
                                       (selectedFood.name.toLowerCase().includes('rice') ||
                                        selectedFood.name.toLowerCase().includes('bread') ||
                                        selectedFood.name.toLowerCase().includes('pasta') ||
                                        selectedFood.name.toLowerCase().includes('potato') ||
                                        selectedFood.name.toLowerCase().includes('oat') ||
                                        selectedFood.name.toLowerCase().includes('wheat') ||
                                        selectedFood.name.toLowerCase().includes('corn') ||
                                        selectedFood.name.toLowerCase().includes('bean') ||
                                        selectedFood.name.toLowerCase().includes('lentil')))) && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Wheat className="w-4 h-4 text-[#9BE15D]" />
                                                    <h6 className="text-xs font-medium text-[#9BE15D]">Carbohydrates</h6>
                                                </div>
                                                {(() => {
                                                    const fiberAmount = selectedFood.macros.fiber ? selectedFood.macros.fiber * (weightGrams / selectedFood.servingSize) : 0
                                                    const sugarAmount = selectedFood.macros.sugar ? selectedFood.macros.sugar * (weightGrams / selectedFood.servingSize) : 0
                                                    const totalCarbs = selectedFood.macros.carbs * (weightGrams / selectedFood.servingSize)

                                                    if (fiberAmount >= 3) {
                                                        return (
                                                            <Badge variant="default" className="text-xs">
                                                                <Star className="w-3 h-3 mr-1" />
                                                                High Fiber
                                                            </Badge>
                                                        )
                                                    } else if (totalCarbs > 0 && sugarAmount / totalCarbs > 0.5) {
                                                        return (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                High Sugar
                                                            </Badge>
                                                        )
                                                    } else if (totalCarbs > 0 && sugarAmount / totalCarbs < 0.1) {
                                                        return (
                                                            <Badge variant="default" className="text-xs">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Low Sugar
                                                            </Badge>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>

                                            <div className="space-y-3">
                                                {/* Simple Carbs (sugars) */}
                                                {(() => {
                                                    const sugarAmount = (selectedFood.macros.sugar || 0) * (weightGrams / selectedFood.servingSize)
                                                    return sugarAmount > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Zap className="w-4 h-4 text-[#FF6B6B]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Simple Carbs</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#9BE15D]">
                                                                    {formatNutrientValue(sugarAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Fast energy absorption</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Complex Carbs */}
                                                {(() => {
                                                    const complexCarbs = selectedFood.macros.carbs - (selectedFood.macros.sugar || 0) - (selectedFood.macros.fiber || 0)
                                                    const complexCarbAmount = Math.max(0, complexCarbs * (weightGrams / selectedFood.servingSize))
                                                    return complexCarbAmount > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Leaf className="w-4 h-4 text-[#9BE15D]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Complex Carbs</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#9BE15D]">
                                                                    {formatNutrientValue(complexCarbAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Sustained energy release</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Fiber */}
                                                {(() => {
                                                    const fiberAmount = (selectedFood.macros.fiber || 0) * (weightGrams / selectedFood.servingSize)
                                                    return fiberAmount > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Leaf className="w-4 h-4 text-[#00E676]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Fiber</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#9BE15D]">
                                                                    {formatNutrientValue(fiberAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Supports digestive health</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Slow Carbs */}
                                                {(() => {
                                                    const isSlowCarb = selectedFood.name.toLowerCase().includes('oat') ||
                                                                     selectedFood.name.toLowerCase().includes('quinoa') ||
                                                                     selectedFood.name.toLowerCase().includes('brown rice') ||
                                                                     selectedFood.name.toLowerCase().includes('barley') ||
                                                                     selectedFood.name.toLowerCase().includes('bulgur') ||
                                                                     selectedFood.name.toLowerCase().includes('lentil') ||
                                                                     selectedFood.name.toLowerCase().includes('chickpea') ||
                                                                     selectedFood.name.toLowerCase().includes('black bean') ||
                                                                     selectedFood.name.toLowerCase().includes('sweet potato')

                                                    const slowCarbAmount = isSlowCarb ? Math.max(0, (selectedFood.macros.carbs - (selectedFood.macros.sugar || 0)) * (weightGrams / selectedFood.servingSize)) : 0

                                                    return slowCarbAmount > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Wheat className="w-4 h-4 text-[#A1A1AA]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Slow Carbs</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#9BE15D]">
                                                                    {formatNutrientValue(slowCarbAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Gradual glucose release</div>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Fats Quality Breakdown */}
                                    {((selectedFood.macros.saturatedFat && selectedFood.macros.saturatedFat > 0) ||
                                      (selectedFood.macros.transFat && selectedFood.macros.transFat > 0) ||
                                      (selectedFood.macros.cholesterol && selectedFood.macros.cholesterol > 0)) && (
                                        <div className="mb-6">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Droplets className="w-4 h-4 text-[#FF2D55]" />
                                                    <h6 className="text-xs font-medium text-[#FF2D55]">Fats</h6>
                                                </div>
                                                {(() => {
                                                    const transFat = selectedFood.macros.transFat ? selectedFood.macros.transFat * (weightGrams / selectedFood.servingSize) : 0
                                                    const saturatedFat = selectedFood.macros.saturatedFat ? selectedFood.macros.saturatedFat * (weightGrams / selectedFood.servingSize) : 0

                                                    if (transFat > 0) {
                                                        return (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <Shield className="w-3 h-3 mr-1" />
                                                                Contains Trans Fat
                                                            </Badge>
                                                        )
                                                    } else if (saturatedFat > 5) {
                                                        return (
                                                            <Badge variant="secondary" className="text-xs">
                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                High Saturated Fat
                                                            </Badge>
                                                        )
                                                    } else if (saturatedFat < 2 && saturatedFat > 0) {
                                                        return (
                                                            <Badge variant="default" className="text-xs">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Low Saturated Fat
                                                            </Badge>
                                                        )
                                                    }
                                                    return null
                                                })()}
                                            </div>

                                            <div className="space-y-3">
                                                {/* Saturated Fat */}
                                                {(() => {
                                                    const saturatedFatAmount = (selectedFood.macros.saturatedFat || 0) * (weightGrams / selectedFood.servingSize)
                                                    return saturatedFatAmount > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Droplets className="w-4 h-4 text-[#FF6B6B]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Saturated Fat</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#FF2D55]">
                                                                    {formatNutrientValue(saturatedFatAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Limit to less than 10% of daily calories</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Unsaturated Fat */}
                                                {(() => {
                                                    const totalFat = selectedFood.macros.fats * (weightGrams / selectedFood.servingSize)
                                                    const saturatedFat = (selectedFood.macros.saturatedFat || 0) * (weightGrams / selectedFood.servingSize)
                                                    const transFat = (selectedFood.macros.transFat || 0) * (weightGrams / selectedFood.servingSize)
                                                    const unsaturatedFat = Math.max(0, totalFat - saturatedFat - transFat)

                                                    return unsaturatedFat > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Heart className="w-4 h-4 text-[#00E676]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Unsaturated Fat</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#FF2D55]">
                                                                    {formatNutrientValue(unsaturatedFat)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Heart-healthy fats (mono & polyunsaturated)</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Omega-3 */}
                                                {(() => {
                                                    const isOmega3Source = selectedFood.name.toLowerCase().includes('salmon') ||
                                                                          selectedFood.name.toLowerCase().includes('tuna') ||
                                                                          selectedFood.name.toLowerCase().includes('sardine') ||
                                                                          selectedFood.name.toLowerCase().includes('mackerel') ||
                                                                          selectedFood.name.toLowerCase().includes('herring') ||
                                                                          selectedFood.name.toLowerCase().includes('flax') ||
                                                                          selectedFood.name.toLowerCase().includes('chia') ||
                                                                          selectedFood.name.toLowerCase().includes('walnut') ||
                                                                          selectedFood.name.toLowerCase().includes('hemp') ||
                                                                          selectedFood.name.toLowerCase().includes('fish oil')

                                                    const estimatedOmega3 = isOmega3Source ? Math.max(0, ((selectedFood.macros.polyunsaturatedFat || selectedFood.macros.fats * 0.3) * (weightGrams / selectedFood.servingSize))) : 0

                                                    return estimatedOmega3 > 0.1 && (
                                                        <div className="bg-[#0E0F13] border border-[#212227] rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <Zap className="w-4 h-4 text-[#4ECDC4]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Omega-3</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#FF2D55]">
                                                                    {formatNutrientValue(estimatedOmega3)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#7A7F86]">Essential fatty acids for brain & heart health</div>
                                                        </div>
                                                    )
                                                })()}

                                                {/* Trans Fat - Priority Warning */}
                                                {(() => {
                                                    const transFatAmount = (selectedFood.macros.transFat || 0) * (weightGrams / selectedFood.servingSize)
                                                    return transFatAmount > 0.01 && (
                                                        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-[10px] p-3">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center space-x-2">
                                                                    <X className="w-4 h-4 text-[#EF4444]" />
                                                                    <span className="text-sm font-medium text-[#F3F4F6]">Trans Fat</span>
                                                                </div>
                                                                <span className="text-lg font-bold text-[#EF4444]">
                                                                    {formatNutrientValue(transFatAmount)}g
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-[#EF4444] font-medium">⚠️ Avoid when possible - increases bad cholesterol</div>
                                                        </div>
                                                    )
                                                })()}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vitamins & Minerals - Organized by Category */}
                                    {Object.entries(selectedFood.macros).some(([key, value]) =>
                                        ['vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'thiamine', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'biotin', 'pantothenicAcid', 'calcium', 'iron', 'potassium', 'phosphorus', 'iodine', 'magnesium', 'zinc', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum'].includes(key) && value && value > 0.1
                                    ) && (
                                        <div className="space-y-5">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-1 h-5 bg-gradient-to-b from-[#2A8CEA] to-[#1659BF] rounded-full"></div>
                                                <h6 className="text-sm font-semibold text-[#F3F4F6]">Vitamins & Minerals</h6>
                                            </div>

                                            {/* Fat-Soluble Vitamins */}
                                            {(() => {
                                                const fatSolubleVitamins = [
                                                    { key: 'vitaminA', name: 'Vitamin A', unit: 'IU', color: 'text-[#FF9500]', description: 'Vision, immune function' },
                                                    { key: 'vitaminD', name: 'Vitamin D', unit: 'IU', color: 'text-[#FFD700]', description: 'Bone health, calcium absorption' },
                                                    { key: 'vitaminE', name: 'Vitamin E', unit: 'mg', color: 'text-[#00E676]', description: 'Antioxidant, cell protection' },
                                                    { key: 'vitaminK', name: 'Vitamin K', unit: 'mcg', color: 'text-[#4ECDC4]', description: 'Blood clotting, bone health' }
                                                ]
                                                const hasAny = fatSolubleVitamins.some(v => selectedFood.macros[v.key as keyof DetailedNutrients] && (selectedFood.macros[v.key as keyof DetailedNutrients] as number) > 0.1)
                                                return hasAny && (
                                                    <div>
                                                        <h6 className="text-xs font-medium text-[#A1A1AA] mb-3">Fat-Soluble Vitamins</h6>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {fatSolubleVitamins.map(vitamin => {
                                                                const value = selectedFood.macros[vitamin.key as keyof DetailedNutrients] as number | undefined
                                                                if (!value || value <= 0.1) return null
                                                                const adjustedValue = value * (weightGrams / selectedFood.servingSize)
                                                                return (
                                                                    <div key={vitamin.key} className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className="text-xs font-medium text-[#F3F4F6]">{vitamin.name}</span>
                                                                            <span className={`text-sm font-bold ${vitamin.color}`}>
                                                                                {formatNutrientValue(adjustedValue)}{vitamin.unit}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-[#7A7F86]">{vitamin.description}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            {/* Water-Soluble Vitamins */}
                                            {(() => {
                                                const waterSolubleVitamins = [
                                                    { key: 'vitaminC', name: 'Vitamin C', unit: 'mg', color: 'text-[#FF6B6B]', description: 'Immune function, collagen' },
                                                    { key: 'thiamine', name: 'B1 (Thiamine)', unit: 'mg', color: 'text-[#9BE15D]', description: 'Energy metabolism' },
                                                    { key: 'riboflavin', name: 'B2 (Riboflavin)', unit: 'mg', color: 'text-[#9BE15D]', description: 'Energy production' },
                                                    { key: 'niacin', name: 'B3 (Niacin)', unit: 'mg', color: 'text-[#9BE15D]', description: 'DNA repair, metabolism' },
                                                    { key: 'vitaminB6', name: 'B6', unit: 'mg', color: 'text-[#9BE15D]', description: 'Brain development' },
                                                    { key: 'folate', name: 'B9 (Folate)', unit: 'mcg', color: 'text-[#9BE15D]', description: 'Cell growth, DNA' },
                                                    { key: 'vitaminB12', name: 'B12', unit: 'mcg', color: 'text-[#9BE15D]', description: 'Nerve function, red blood cells' },
                                                    { key: 'biotin', name: 'B7 (Biotin)', unit: 'mcg', color: 'text-[#9BE15D]', description: 'Hair, skin, nails' },
                                                    { key: 'pantothenicAcid', name: 'B5 (Pantothenic)', unit: 'mg', color: 'text-[#9BE15D]', description: 'Hormone synthesis' }
                                                ]
                                                const hasAny = waterSolubleVitamins.some(v => selectedFood.macros[v.key as keyof DetailedNutrients] && (selectedFood.macros[v.key as keyof DetailedNutrients] as number) > 0.1)
                                                return hasAny && (
                                                    <div>
                                                        <h6 className="text-xs font-medium text-[#A1A1AA] mb-3">Water-Soluble Vitamins (B-Complex & C)</h6>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {waterSolubleVitamins.map(vitamin => {
                                                                const value = selectedFood.macros[vitamin.key as keyof DetailedNutrients] as number | undefined
                                                                if (!value || value <= 0.1) return null
                                                                const adjustedValue = value * (weightGrams / selectedFood.servingSize)
                                                                return (
                                                                    <div key={vitamin.key} className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className="text-xs font-medium text-[#F3F4F6]">{vitamin.name}</span>
                                                                            <span className={`text-sm font-bold ${vitamin.color}`}>
                                                                                {formatNutrientValue(adjustedValue)}{vitamin.unit}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-[#7A7F86]">{vitamin.description}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            {/* Major Minerals */}
                                            {(() => {
                                                const majorMinerals = [
                                                    { key: 'calcium', name: 'Calcium', unit: 'mg', color: 'text-[#2A8CEA]', description: 'Bones, teeth, muscle function' },
                                                    { key: 'phosphorus', name: 'Phosphorus', unit: 'mg', color: 'text-[#2A8CEA]', description: 'Bone health, energy' },
                                                    { key: 'magnesium', name: 'Magnesium', unit: 'mg', color: 'text-[#2A8CEA]', description: 'Muscle, nerve function' },
                                                    { key: 'potassium', name: 'Potassium', unit: 'mg', color: 'text-[#2A8CEA]', description: 'Heart, muscle function' }
                                                ]
                                                const hasAny = majorMinerals.some(m => selectedFood.macros[m.key as keyof DetailedNutrients] && (selectedFood.macros[m.key as keyof DetailedNutrients] as number) > 0.1)
                                                return hasAny && (
                                                    <div>
                                                        <h6 className="text-xs font-medium text-[#A1A1AA] mb-3">Major Minerals</h6>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {majorMinerals.map(mineral => {
                                                                const value = selectedFood.macros[mineral.key as keyof DetailedNutrients] as number | undefined
                                                                if (!value || value <= 0.1) return null
                                                                const adjustedValue = value * (weightGrams / selectedFood.servingSize)
                                                                return (
                                                                    <div key={mineral.key} className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className="text-xs font-medium text-[#F3F4F6]">{mineral.name}</span>
                                                                            <span className={`text-sm font-bold ${mineral.color}`}>
                                                                                {formatNutrientValue(adjustedValue)}{mineral.unit}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-[#7A7F86]">{mineral.description}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })()}

                                            {/* Trace Minerals */}
                                            {(() => {
                                                const traceMinerals = [
                                                    { key: 'iron', name: 'Iron', unit: 'mg', color: 'text-[#FF375F]', description: 'Oxygen transport, energy' },
                                                    { key: 'zinc', name: 'Zinc', unit: 'mg', color: 'text-[#A1A1AA]', description: 'Immune function, wound healing' },
                                                    { key: 'selenium', name: 'Selenium', unit: 'mcg', color: 'text-[#A1A1AA]', description: 'Antioxidant, thyroid' },
                                                    { key: 'copper', name: 'Copper', unit: 'mg', color: 'text-[#FF9500]', description: 'Iron absorption, nerves' },
                                                    { key: 'manganese', name: 'Manganese', unit: 'mg', color: 'text-[#A1A1AA]', description: 'Bone formation, metabolism' },
                                                    { key: 'iodine', name: 'Iodine', unit: 'mcg', color: 'text-[#A1A1AA]', description: 'Thyroid hormone production' },
                                                    { key: 'chromium', name: 'Chromium', unit: 'mcg', color: 'text-[#A1A1AA]', description: 'Blood sugar regulation' },
                                                    { key: 'molybdenum', name: 'Molybdenum', unit: 'mcg', color: 'text-[#A1A1AA]', description: 'Enzyme function' }
                                                ]
                                                const hasAny = traceMinerals.some(m => selectedFood.macros[m.key as keyof DetailedNutrients] && (selectedFood.macros[m.key as keyof DetailedNutrients] as number) > 0.1)
                                                return hasAny && (
                                                    <div>
                                                        <h6 className="text-xs font-medium text-[#A1A1AA] mb-3">Trace Minerals</h6>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            {traceMinerals.map(mineral => {
                                                                const value = selectedFood.macros[mineral.key as keyof DetailedNutrients] as number | undefined
                                                                if (!value || value <= 0.1) return null
                                                                const adjustedValue = value * (weightGrams / selectedFood.servingSize)
                                                                return (
                                                                    <div key={mineral.key} className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                                                        <div className="flex items-start justify-between mb-1">
                                                                            <span className="text-xs font-medium text-[#F3F4F6]">{mineral.name}</span>
                                                                            <span className={`text-sm font-bold ${mineral.color}`}>
                                                                                {formatNutrientValue(adjustedValue)}{mineral.unit}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-[10px] text-[#7A7F86]">{mineral.description}</p>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:border-[#2A2B31] bg-transparent"
                    >
                        Cancel
                    </Button>

                    {activeTab === "manual" ? (
                        <Button
                            onClick={handleManualSave}
                            disabled={!manualFood.name.trim()}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to {getMealDisplayName()}
                        </Button>
                    ) : selectedFood ? (
                        <Button
                            onClick={handleSelectedFoodSave}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to {getMealDisplayName()}
                        </Button>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}