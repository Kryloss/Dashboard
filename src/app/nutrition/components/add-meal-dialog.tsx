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
        animalProtein: 0,
        plantProtein: 0,
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

    const [activeTab, setActiveTab] = useState<"search" | "manual" | "recent">("search")
    const [isEditMode, setIsEditMode] = useState(false) // Track if user is editing manual entry

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
        // Auto-populate manual entry form with selected food data
        setManualFood({
            name: foodResult.name,
            brand: foodResult.brand || "",
            servingSize: foodResult.servingSize,
            servingUnit: foodResult.servingUnit,
            calories: foodResult.caloriesPerServing,
            carbs: foodResult.macros.carbs,
            protein: foodResult.macros.protein,
            fats: foodResult.macros.fats,
            fiber: foodResult.macros.fiber || 0,
            sugar: foodResult.macros.sugar || 0,
            sodium: foodResult.macros.sodium || 0,
            saturatedFat: foodResult.macros.saturatedFat || 0,
            transFat: foodResult.macros.transFat || 0,
            monounsaturatedFat: foodResult.macros.monounsaturatedFat || 0,
            polyunsaturatedFat: foodResult.macros.polyunsaturatedFat || 0,
            cholesterol: foodResult.macros.cholesterol || 0,
            animalProtein: foodResult.macros.animalProtein || 0,
            plantProtein: foodResult.macros.plantProtein || 0,
            potassium: foodResult.macros.potassium || 0,
            vitaminA: foodResult.macros.vitaminA || 0,
            vitaminC: foodResult.macros.vitaminC || 0,
            calcium: foodResult.macros.calcium || 0,
            iron: foodResult.macros.iron || 0,
            vitaminD: foodResult.macros.vitaminD || 0,
            vitaminE: foodResult.macros.vitaminE || 0,
            vitaminK: foodResult.macros.vitaminK || 0,
            thiamine: foodResult.macros.thiamine || 0,
            riboflavin: foodResult.macros.riboflavin || 0,
            niacin: foodResult.macros.niacin || 0,
            vitaminB6: foodResult.macros.vitaminB6 || 0,
            folate: foodResult.macros.folate || 0,
            vitaminB12: foodResult.macros.vitaminB12 || 0,
            biotin: foodResult.macros.biotin || 0,
            pantothenicAcid: foodResult.macros.pantothenicAcid || 0,
            phosphorus: foodResult.macros.phosphorus || 0,
            iodine: foodResult.macros.iodine || 0,
            magnesium: foodResult.macros.magnesium || 0,
            zinc: foodResult.macros.zinc || 0,
            selenium: foodResult.macros.selenium || 0,
            copper: foodResult.macros.copper || 0,
            manganese: foodResult.macros.manganese || 0,
            chromium: foodResult.macros.chromium || 0,
            molybdenum: foodResult.macros.molybdenum || 0
        })

        // Switch to Manual Entry tab in read-only mode
        setActiveTab("manual")
        setIsEditMode(false) // Show as read-only summary first
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
                animalProtein: manualFood.animalProtein || undefined,
                plantProtein: manualFood.plantProtein || undefined,
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

            // Add as 1 serving (manual entry already has the desired serving size)
            await onFoodAdded(food, 1, undefined)

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

    const handleClose = () => {
        setSearchQuery("")
        setSearchMode('food')
        setBrandFilter("")
        setSearchResults([])
        setAvailableBrands([])
        setIsEditMode(false) // Reset edit mode
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
            animalProtein: 0,
            plantProtein: 0,
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

    // Check if manual food has any data (not freshly created)
    const manualFoodHasData = () => {
        return manualFood.name.trim() !== "" ||
               manualFood.calories > 0 ||
               manualFood.carbs > 0 ||
               manualFood.protein > 0 ||
               manualFood.fats > 0
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
                        <TabsTrigger
                            value="manual"
                            className="data-[state=active]:bg-[#2A8CEA] data-[state=active]:text-white"
                            onClick={() => {
                                // If switching to manual tab and no data, enable edit mode
                                if (!manualFoodHasData()) {
                                    setIsEditMode(true)
                                }
                            }}
                        >
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
                    <TabsContent value="manual" className="space-y-6">
                        {/* Read-Only Summary View (when auto-filled from search) */}
                        {!isEditMode && manualFoodHasData() ? (
                            <div className="space-y-4">
                                {/* Food Header */}
                                <div className="bg-[#121318] border border-[#212227] rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-[#F3F4F6] font-medium text-lg">{manualFood.name}</h4>
                                            {manualFood.brand && (
                                                <p className="text-[#A1A1AA] text-sm mt-0.5">{manualFood.brand}</p>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => setIsEditMode(true)}
                                            variant="outline"
                                            size="sm"
                                            className="border-[#2A8CEA]/30 text-[#2A8CEA] hover:bg-[#2A8CEA]/10"
                                        >
                                            <Edit3 className="w-3 h-3 mr-1.5" />
                                            Edit
                                        </Button>
                                    </div>

                                    {/* Serving Info - Editable */}
                                    <div className="space-y-2">
                                        <Label className="text-[#A1A1AA] text-sm">Serving Amount</Label>
                                        <div className="flex items-center space-x-2">
                                            <Input
                                                type="number"
                                                value={manualFood.servingSize}
                                                onChange={(e) => setManualFood({ ...manualFood, servingSize: Number(e.target.value) })}
                                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] w-24"
                                                min="0"
                                                step="0.1"
                                            />
                                            <Select value={manualFood.servingUnit} onValueChange={(val) => setManualFood({ ...manualFood, servingUnit: val })}>
                                                <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-[#1a1b1f] border-[#212227]">
                                                    <SelectItem value="g" className="text-[#F3F4F6]">g</SelectItem>
                                                    <SelectItem value="ml" className="text-[#F3F4F6]">ml</SelectItem>
                                                    <SelectItem value="oz" className="text-[#F3F4F6]">oz</SelectItem>
                                                    <SelectItem value="cup" className="text-[#F3F4F6]">cup</SelectItem>
                                                    <SelectItem value="tbsp" className="text-[#F3F4F6]">tbsp</SelectItem>
                                                    <SelectItem value="tsp" className="text-[#F3F4F6]">tsp</SelectItem>
                                                    <SelectItem value="piece" className="text-[#F3F4F6]">piece</SelectItem>
                                                    <SelectItem value="slice" className="text-[#F3F4F6]">slice</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <p className="text-[#7A7F86] text-xs">Adjust amount as needed</p>
                                    </div>
                                </div>

                                {/* Main Macros Display */}
                                <div className="bg-[#121318] border border-[#212227] rounded-lg p-4">
                                    <div className="grid grid-cols-4 gap-4 text-center">
                                        <div>
                                            <div className="text-2xl font-bold text-[#F3F4F6]">{manualFood.calories}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">calories</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-[#9BE15D]">{formatNutrientValue(manualFood.carbs)}g</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">carbs</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-[#2A8CEA]">{formatNutrientValue(manualFood.protein)}g</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">protein</div>
                                        </div>
                                        <div>
                                            <div className="text-2xl font-bold text-[#FF2D55]">{formatNutrientValue(manualFood.fats)}g</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">fats</div>
                                        </div>
                                    </div>

                                    {/* Additional Macros - Only show if non-zero */}
                                    {(manualFood.fiber > 0 || manualFood.sugar > 0 || manualFood.sodium > 0) && (
                                        <div className="grid grid-cols-3 gap-4 text-center mt-4 pt-4 border-t border-[#212227]">
                                            {manualFood.fiber > 0 && (
                                                <div>
                                                    <div className="text-lg font-semibold text-[#9BE15D]">{formatNutrientValue(manualFood.fiber)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">fiber</div>
                                                </div>
                                            )}
                                            {manualFood.sugar > 0 && (
                                                <div>
                                                    <div className="text-lg font-semibold text-[#FF6B6B]">{formatNutrientValue(manualFood.sugar)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">sugar</div>
                                                </div>
                                            )}
                                            {manualFood.sodium > 0 && (
                                                <div>
                                                    <div className="text-lg font-semibold text-[#A1A1AA]">{formatNutrientValue(manualFood.sodium)}mg</div>
                                                    <div className="text-xs text-[#A1A1AA]">sodium</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Nutritional Insights - Smart Tips (Read-only version) */}
                                {(manualFood.carbs > 0 || manualFood.protein > 0 || manualFood.fats > 0) && (
                                    <div className="bg-[#0E0F13] border border-[#2A8CEA]/20 rounded-lg p-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Star className="w-4 h-4 text-[#2A8CEA]" />
                                                <h5 className="text-[#F3F4F6] text-sm font-medium">Nutritional Insights</h5>
                                            </div>
                                            {/* Health Score Badge */}
                                            {(() => {
                                                let score = 0
                                                let maxScore = 0

                                                if (manualFood.protein > 0) {
                                                    maxScore += 2
                                                    const hasCompleteProtein = (manualFood.animalProtein || 0) > 0 ||
                                                                               manualFood.name.toLowerCase().includes('meat') ||
                                                                               manualFood.name.toLowerCase().includes('fish') ||
                                                                               manualFood.name.toLowerCase().includes('chicken') ||
                                                                               manualFood.name.toLowerCase().includes('egg')
                                                    if (hasCompleteProtein) score += 2
                                                    else score += 1
                                                }

                                                if (manualFood.fiber > 0) {
                                                    maxScore += 2
                                                    if (manualFood.fiber >= 3) score += 2
                                                    else if (manualFood.fiber >= 1) score += 1
                                                }

                                                if (manualFood.carbs > 0) {
                                                    maxScore += 1
                                                    const sugarRatio = manualFood.sugar / manualFood.carbs
                                                    if (sugarRatio < 0.1) score += 1
                                                    else if (sugarRatio < 0.3) score += 0.5
                                                }

                                                if (manualFood.saturatedFat > 0) {
                                                    maxScore += 1
                                                    if (manualFood.saturatedFat < 2) score += 1
                                                    else if (manualFood.saturatedFat < 5) score += 0.5
                                                }

                                                if (manualFood.transFat > 0) {
                                                    score -= 2
                                                }

                                                maxScore = Math.max(maxScore, 1)
                                                const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100))

                                                let badgeText = 'Poor'
                                                let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "destructive"
                                                if (percentage >= 80) {
                                                    badgeText = 'Excellent'
                                                    badgeVariant = "default"
                                                } else if (percentage >= 60) {
                                                    badgeText = 'Good'
                                                    badgeVariant = "secondary"
                                                } else if (percentage >= 40) {
                                                    badgeText = 'Fair'
                                                    badgeVariant = "outline"
                                                }

                                                return (
                                                    <div className="flex items-center space-x-2">
                                                        <Badge variant={badgeVariant} className="text-xs">
                                                            {percentage >= 80 && <Star className="w-3 h-3 mr-1" />}
                                                            {percentage >= 60 && percentage < 80 && <CheckCircle className="w-3 h-3 mr-1" />}
                                                            {percentage >= 40 && percentage < 60 && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                            {percentage < 40 && <X className="w-3 h-3 mr-1" />}
                                                            {badgeText}
                                                        </Badge>
                                                        <span className="text-xs text-[#7A7F86]">{Math.round(percentage)}%</span>
                                                    </div>
                                                )
                                            })()}
                                        </div>

                                        {/* Quality Badges */}
                                        <div className="flex flex-wrap gap-2">
                                            {manualFood.protein > 0 && (() => {
                                                const hasCompleteProtein = (manualFood.animalProtein || 0) > 0 ||
                                                                           manualFood.name.toLowerCase().includes('meat') ||
                                                                           manualFood.name.toLowerCase().includes('fish') ||
                                                                           manualFood.name.toLowerCase().includes('chicken') ||
                                                                           manualFood.name.toLowerCase().includes('egg') ||
                                                                           manualFood.name.toLowerCase().includes('quinoa') ||
                                                                           manualFood.name.toLowerCase().includes('soy')
                                                return (
                                                    <Badge variant={hasCompleteProtein ? "default" : "secondary"} className="text-xs">
                                                        {hasCompleteProtein ? <Star className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                                        {hasCompleteProtein ? 'Complete Protein' : 'Incomplete Protein'}
                                                    </Badge>
                                                )
                                            })()}

                                            {manualFood.carbs > 0 && (() => {
                                                if (manualFood.fiber >= 3) {
                                                    return (
                                                        <Badge variant="default" className="text-xs">
                                                            <Star className="w-3 h-3 mr-1" />
                                                            High Fiber
                                                        </Badge>
                                                    )
                                                } else if (manualFood.carbs > 0 && manualFood.sugar / manualFood.carbs > 0.5) {
                                                    return (
                                                        <Badge variant="destructive" className="text-xs">
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            High Sugar
                                                        </Badge>
                                                    )
                                                } else if (manualFood.carbs > 0 && manualFood.sugar / manualFood.carbs < 0.1) {
                                                    return (
                                                        <Badge variant="default" className="text-xs">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Low Sugar
                                                        </Badge>
                                                    )
                                                }
                                                return null
                                            })()}

                                            {manualFood.fats > 0 && (() => {
                                                if (manualFood.transFat > 0) {
                                                    return (
                                                        <Badge variant="destructive" className="text-xs">
                                                            <Shield className="w-3 h-3 mr-1" />
                                                            Contains Trans Fat
                                                        </Badge>
                                                    )
                                                } else if (manualFood.saturatedFat > 5) {
                                                    return (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <AlertTriangle className="w-3 h-3 mr-1" />
                                                            High Saturated Fat
                                                        </Badge>
                                                    )
                                                } else if (manualFood.saturatedFat < 2 && manualFood.saturatedFat > 0) {
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

                                        {/* Smart Tips */}
                                        <div className="text-xs text-[#A1A1AA] space-y-1">
                                            {manualFood.fiber >= 3 && (
                                                <p className="flex items-start space-x-2">
                                                    <CheckCircle className="w-3 h-3 text-[#00E676] mt-0.5 flex-shrink-0" />
                                                    <span>Excellent source of fiber - supports digestive health</span>
                                                </p>
                                            )}
                                            {manualFood.transFat > 0 && (
                                                <p className="flex items-start space-x-2">
                                                    <X className="w-3 h-3 text-[#EF4444] mt-0.5 flex-shrink-0" />
                                                    <span className="text-[#EF4444]">Contains trans fat - avoid when possible</span>
                                                </p>
                                            )}
                                            {manualFood.saturatedFat > 0 && manualFood.saturatedFat < 2 && (
                                                <p className="flex items-start space-x-2">
                                                    <Heart className="w-3 h-3 text-[#00E676] mt-0.5 flex-shrink-0" />
                                                    <span>Low saturated fat - heart-healthy choice</span>
                                                </p>
                                            )}
                                            {manualFood.protein > 10 && (manualFood.animalProtein || 0) > 0 && (
                                                <p className="flex items-start space-x-2">
                                                    <Beef className="w-3 h-3 text-[#2A8CEA] mt-0.5 flex-shrink-0" />
                                                    <span>High in complete protein with all essential amino acids</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Fat Breakdown - Only show if any values are non-zero */}
                                {(manualFood.saturatedFat > 0 || manualFood.transFat > 0 || manualFood.monounsaturatedFat > 0 || manualFood.polyunsaturatedFat > 0 || manualFood.cholesterol > 0) && (
                                    <div className="bg-[#121318] border border-[#212227] rounded-lg p-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Droplets className="w-4 h-4 text-[#FF2D55]" />
                                            <span className="font-medium text-sm text-[#F3F4F6]">Fat Details</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {manualFood.saturatedFat > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#F3F4F6]">{formatNutrientValue(manualFood.saturatedFat)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Saturated Fat</div>
                                                </div>
                                            )}
                                            {manualFood.transFat > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#EF4444]">{formatNutrientValue(manualFood.transFat)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Trans Fat</div>
                                                </div>
                                            )}
                                            {manualFood.monounsaturatedFat > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#9BE15D]">{formatNutrientValue(manualFood.monounsaturatedFat)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Monounsaturated</div>
                                                </div>
                                            )}
                                            {manualFood.polyunsaturatedFat > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#9BE15D]">{formatNutrientValue(manualFood.polyunsaturatedFat)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Polyunsaturated</div>
                                                </div>
                                            )}
                                            {manualFood.cholesterol > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#F3F4F6]">{formatNutrientValue(manualFood.cholesterol)}mg</div>
                                                    <div className="text-xs text-[#A1A1AA]">Cholesterol</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Protein Breakdown - Only show if any values are non-zero */}
                                {(manualFood.animalProtein > 0 || manualFood.plantProtein > 0) && (
                                    <div className="bg-[#121318] border border-[#212227] rounded-lg p-4">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Beef className="w-4 h-4 text-[#2A8CEA]" />
                                            <span className="font-medium text-sm text-[#F3F4F6]">Protein Quality</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {manualFood.animalProtein > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#2A8CEA]">{formatNutrientValue(manualFood.animalProtein)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Animal Protein</div>
                                                </div>
                                            )}
                                            {manualFood.plantProtein > 0 && (
                                                <div>
                                                    <div className="text-sm font-semibold text-[#9BE15D]">{formatNutrientValue(manualFood.plantProtein)}g</div>
                                                    <div className="text-xs text-[#A1A1AA]">Plant Protein</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Editable Form View */
                            <>
                        {/* Header with guidance */}
                        <div className="bg-gradient-to-r from-[#2A8CEA]/10 to-[#9BE15D]/10 border border-[#2A8CEA]/30 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <Edit3 className="w-5 h-5 text-[#2A8CEA] mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="text-[#F3F4F6] font-medium mb-1">Create Custom Food Entry</h4>
                                    <p className="text-[#A1A1AA] text-sm">
                                        Enter nutrition information from food labels or your own recipes. All optional fields help provide more accurate tracking.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 mb-3">
                                <Database className="w-4 h-4 text-[#F3F4F6]" />
                                <h4 className="text-[#F3F4F6] font-medium">Basic Information</h4>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[#F3F4F6] text-sm font-medium flex items-center space-x-1">
                                        <span>Food Name</span>
                                        <span className="text-[#FF2D55]">*</span>
                                    </Label>
                                    <Input
                                        placeholder="e.g., Grilled Chicken Breast"
                                        value={manualFood.name}
                                        onChange={(e) => setManualFood({ ...manualFood, name: e.target.value })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] mt-1.5"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">Enter a descriptive name</p>
                                </div>
                                <div>
                                    <Label className="text-[#F3F4F6] text-sm font-medium">Brand (Optional)</Label>
                                    <Input
                                        placeholder="e.g., Tyson, Kirkland"
                                        value={manualFood.brand}
                                        onChange={(e) => setManualFood({ ...manualFood, brand: e.target.value })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86] mt-1.5"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">Helps organize your foods</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-[#F3F4F6] text-sm font-medium flex items-center space-x-1">
                                        <span>Serving Size</span>
                                        <span className="text-[#FF2D55]">*</span>
                                    </Label>
                                    <div className="flex space-x-2 mt-1.5">
                                        <Input
                                            type="number"
                                            placeholder="100"
                                            value={manualFood.servingSize}
                                            onChange={(e) => setManualFood({ ...manualFood, servingSize: Number(e.target.value) })}
                                            className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                            min="0"
                                            step="0.1"
                                        />
                                        <Select value={manualFood.servingUnit} onValueChange={(val) => setManualFood({ ...manualFood, servingUnit: val })}>
                                            <SelectTrigger className="bg-[#121318] border-[#212227] text-[#F3F4F6] w-28">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1a1b1f] border-[#212227]">
                                                <SelectItem value="g" className="text-[#F3F4F6]">g</SelectItem>
                                                <SelectItem value="ml" className="text-[#F3F4F6]">ml</SelectItem>
                                                <SelectItem value="oz" className="text-[#F3F4F6]">oz</SelectItem>
                                                <SelectItem value="cup" className="text-[#F3F4F6]">cup</SelectItem>
                                                <SelectItem value="tbsp" className="text-[#F3F4F6]">tbsp</SelectItem>
                                                <SelectItem value="tsp" className="text-[#F3F4F6]">tsp</SelectItem>
                                                <SelectItem value="piece" className="text-[#F3F4F6]">piece</SelectItem>
                                                <SelectItem value="slice" className="text-[#F3F4F6]">slice</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <p className="text-[#7A7F86] text-xs mt-1">Standard portion size</p>
                                </div>
                                <div>
                                    <Label className="text-[#F3F4F6] text-sm font-medium flex items-center space-x-1">
                                        <Zap className="w-3 h-3 text-[#FFA500]" />
                                        <span>Calories</span>
                                        <span className="text-[#FF2D55]">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="200"
                                        value={manualFood.calories}
                                        onChange={(e) => setManualFood({ ...manualFood, calories: Number(e.target.value) })}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6] mt-1.5"
                                        min="0"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">Energy per serving</p>
                                </div>
                            </div>
                        </div>

                        {/* Core Macronutrients */}
                        <div className="bg-[#121318] border border-[#212227] rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Beef className="w-4 h-4 text-[#2A8CEA]" />
                                    <h4 className="text-[#F3F4F6] font-medium">Core Macronutrients</h4>
                                    <span className="text-[#FF2D55] text-xs">*</span>
                                </div>
                                <Badge variant="outline" className="text-[#2A8CEA] border-[#2A8CEA]/30 bg-[#2A8CEA]/10 text-xs">
                                    Required
                                </Badge>
                            </div>
                            <p className="text-[#7A7F86] text-sm -mt-2">These three values are essential for accurate calorie tracking</p>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-[#9BE15D] text-sm font-medium flex items-center space-x-1">
                                        <Wheat className="w-3 h-3" />
                                        <span>Carbs (g)</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="25"
                                        value={manualFood.carbs}
                                        onChange={(e) => setManualFood({ ...manualFood, carbs: Number(e.target.value) })}
                                        className="bg-[#0E0F13] border-[#9BE15D]/20 text-[#F3F4F6] mt-1.5 focus:border-[#9BE15D]/50"
                                        min="0"
                                        step="0.1"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">4 cal/g</p>
                                </div>
                                <div>
                                    <Label className="text-[#2A8CEA] text-sm font-medium flex items-center space-x-1">
                                        <Beef className="w-3 h-3" />
                                        <span>Protein (g)</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="30"
                                        value={manualFood.protein}
                                        onChange={(e) => setManualFood({ ...manualFood, protein: Number(e.target.value) })}
                                        className="bg-[#0E0F13] border-[#2A8CEA]/20 text-[#F3F4F6] mt-1.5 focus:border-[#2A8CEA]/50"
                                        min="0"
                                        step="0.1"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">4 cal/g</p>
                                </div>
                                <div>
                                    <Label className="text-[#FF2D55] text-sm font-medium flex items-center space-x-1">
                                        <Droplets className="w-3 h-3" />
                                        <span>Fats (g)</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        placeholder="10"
                                        value={manualFood.fats}
                                        onChange={(e) => setManualFood({ ...manualFood, fats: Number(e.target.value) })}
                                        className="bg-[#0E0F13] border-[#FF2D55]/20 text-[#F3F4F6] mt-1.5 focus:border-[#FF2D55]/50"
                                        min="0"
                                        step="0.1"
                                    />
                                    <p className="text-[#7A7F86] text-xs mt-1">9 cal/g</p>
                                </div>
                            </div>

                            {/* Macro Calculator Helper */}
                            {(manualFood.carbs > 0 || manualFood.protein > 0 || manualFood.fats > 0) && (
                                <div className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-[#A1A1AA]">Calculated from macros:</span>
                                        <span className="text-[#F3F4F6] font-medium">
                                            {Math.round((manualFood.carbs * 4) + (manualFood.protein * 4) + (manualFood.fats * 9))} calories
                                        </span>
                                    </div>
                                    {Math.abs(manualFood.calories - ((manualFood.carbs * 4) + (manualFood.protein * 4) + (manualFood.fats * 9))) > 10 && manualFood.calories > 0 && (
                                        <p className="text-[#FFA500] text-xs mt-1 flex items-center space-x-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>Calorie mismatch detected - verify your values</span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Carbohydrates Breakdown */}
                                <div className="bg-[#0E0F13] border border-[#9BE15D]/20 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Wheat className="w-4 h-4 text-[#9BE15D]" />
                                        <h5 className="text-[#9BE15D] text-sm font-medium">Carbohydrate Details</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Leaf className="w-3 h-3 text-[#9BE15D]" />
                                                <span>Fiber (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="5"
                                                value={manualFood.fiber}
                                                onChange={(e) => setManualFood({ ...manualFood, fiber: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#9BE15D]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Promotes digestion</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Zap className="w-3 h-3 text-[#FFA500]" />
                                                <span>Sugar (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="10"
                                                value={manualFood.sugar}
                                                onChange={(e) => setManualFood({ ...manualFood, sugar: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#9BE15D]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Simple carbs</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fats Breakdown */}
                                <div className="bg-[#0E0F13] border border-[#FF2D55]/20 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Droplets className="w-4 h-4 text-[#FF2D55]" />
                                        <h5 className="text-[#FF2D55] text-sm font-medium">Fat Details</h5>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <AlertTriangle className="w-3 h-3 text-[#FF2D55]" />
                                                <span>Saturated Fat (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="3"
                                                value={manualFood.saturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, saturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#FF2D55]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Limit intake</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <X className="w-3 h-3 text-[#FF2D55]" />
                                                <span>Trans Fat (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                value={manualFood.transFat}
                                                onChange={(e) => setManualFood({ ...manualFood, transFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#FF2D55]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Avoid if possible</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <CheckCircle className="w-3 h-3 text-[#9BE15D]" />
                                                <span>Monounsaturated (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="5"
                                                value={manualFood.monounsaturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, monounsaturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#FF2D55]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Heart healthy</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <CheckCircle className="w-3 h-3 text-[#9BE15D]" />
                                                <span>Polyunsaturated (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="2"
                                                value={manualFood.polyunsaturatedFat}
                                                onChange={(e) => setManualFood({ ...manualFood, polyunsaturatedFat: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#FF2D55]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Omega-3, Omega-6</p>
                                        </div>
                                        <div className="col-span-2">
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Heart className="w-3 h-3 text-[#FF2D55]" />
                                                <span>Cholesterol (mg)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="60"
                                                value={manualFood.cholesterol}
                                                onChange={(e) => setManualFood({ ...manualFood, cholesterol: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#FF2D55]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Found in animal products</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Protein Quality Breakdown */}
                                <div className="bg-[#0E0F13] border border-[#2A8CEA]/20 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Beef className="w-4 h-4 text-[#2A8CEA]" />
                                            <h5 className="text-[#2A8CEA] text-sm font-medium">Protein Quality</h5>
                                        </div>
                                        <Badge variant="outline" className="text-[#2A8CEA] border-[#2A8CEA]/30 bg-[#2A8CEA]/10 text-xs">
                                            Optional
                                        </Badge>
                                    </div>
                                    <p className="text-[#7A7F86] text-xs">Breakdown your protein sources for better tracking</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Star className="w-3 h-3 text-[#9BE15D]" />
                                                <span>Animal Protein (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="20"
                                                value={manualFood.animalProtein}
                                                onChange={(e) => setManualFood({ ...manualFood, animalProtein: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#2A8CEA]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Complete proteins</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Leaf className="w-3 h-3 text-[#9BE15D]" />
                                                <span>Plant Protein (g)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="10"
                                                value={manualFood.plantProtein}
                                                onChange={(e) => setManualFood({ ...manualFood, plantProtein: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#2A8CEA]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                                step="0.1"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">May need combining</p>
                                        </div>
                                    </div>

                                    {(manualFood.animalProtein > 0 || manualFood.plantProtein > 0) && (
                                        <div className="bg-[#121318] border border-[#212227] rounded-lg p-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[#A1A1AA]">Total protein breakdown:</span>
                                                <span className="text-[#F3F4F6] font-medium">
                                                    {manualFood.animalProtein + manualFood.plantProtein}g
                                                </span>
                                            </div>
                                            {Math.abs(manualFood.protein - (manualFood.animalProtein + manualFood.plantProtein)) > 0.5 && manualFood.protein > 0 && (
                                                <p className="text-[#FFA500] mt-1 flex items-center space-x-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Total should match protein value ({manualFood.protein}g)</span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <details className="text-xs">
                                        <summary className="cursor-pointer text-[#2A8CEA] hover:text-[#4AA7FF] flex items-center space-x-1">
                                            <span>What counts as animal/plant protein?</span>
                                        </summary>
                                        <div className="mt-2 space-y-2 ml-3">
                                            <div>
                                                <span className="text-[#9BE15D]">✅ Animal (Complete):</span>
                                                <p className="text-[#A1A1AA] ml-4">Meat, Fish, Chicken, Eggs, Milk, Cheese, Yogurt, Whey</p>
                                            </div>
                                            <div>
                                                <span className="text-[#9BE15D]">🌱 Plant:</span>
                                                <p className="text-[#A1A1AA] ml-4">Beans, Lentils, Quinoa, Soy, Tofu, Nuts, Seeds, Grains</p>
                                            </div>
                                        </div>
                                    </details>
                                </div>

                        {/* Nutritional Insights - Smart Tips */}
                        {(manualFood.carbs > 0 || manualFood.protein > 0 || manualFood.fats > 0) && (
                            <div className="bg-[#0E0F13] border border-[#2A8CEA]/20 rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Star className="w-4 h-4 text-[#2A8CEA]" />
                                        <h5 className="text-[#F3F4F6] text-sm font-medium">Nutritional Insights</h5>
                                    </div>
                                    {/* Health Score Badge */}
                                    {(() => {
                                        let score = 0
                                        let maxScore = 0

                                        // Protein bonus
                                        if (manualFood.protein > 0) {
                                            maxScore += 2
                                            const hasCompleteProtein = (manualFood.animalProtein || 0) > 0 ||
                                                                       manualFood.name.toLowerCase().includes('meat') ||
                                                                       manualFood.name.toLowerCase().includes('fish') ||
                                                                       manualFood.name.toLowerCase().includes('chicken') ||
                                                                       manualFood.name.toLowerCase().includes('egg')
                                            if (hasCompleteProtein) score += 2
                                            else score += 1
                                        }

                                        // Fiber bonus
                                        if (manualFood.fiber > 0) {
                                            maxScore += 2
                                            if (manualFood.fiber >= 3) score += 2
                                            else if (manualFood.fiber >= 1) score += 1
                                        }

                                        // Low sugar bonus
                                        if (manualFood.carbs > 0) {
                                            maxScore += 1
                                            const sugarRatio = manualFood.sugar / manualFood.carbs
                                            if (sugarRatio < 0.1) score += 1
                                            else if (sugarRatio < 0.3) score += 0.5
                                        }

                                        // Saturated fat check
                                        if (manualFood.saturatedFat > 0) {
                                            maxScore += 1
                                            if (manualFood.saturatedFat < 2) score += 1
                                            else if (manualFood.saturatedFat < 5) score += 0.5
                                        }

                                        // Trans fat penalty
                                        if (manualFood.transFat > 0) {
                                            score -= 2
                                        }

                                        maxScore = Math.max(maxScore, 1)
                                        const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100))

                                        let badgeText = 'Poor'
                                        let badgeVariant: "default" | "secondary" | "outline" | "destructive" = "destructive"
                                        if (percentage >= 80) {
                                            badgeText = 'Excellent'
                                            badgeVariant = "default"
                                        } else if (percentage >= 60) {
                                            badgeText = 'Good'
                                            badgeVariant = "secondary"
                                        } else if (percentage >= 40) {
                                            badgeText = 'Fair'
                                            badgeVariant = "outline"
                                        }

                                        return (
                                            <div className="flex items-center space-x-2">
                                                <Badge variant={badgeVariant} className="text-xs">
                                                    {percentage >= 80 && <Star className="w-3 h-3 mr-1" />}
                                                    {percentage >= 60 && percentage < 80 && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {percentage >= 40 && percentage < 60 && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {percentage < 40 && <X className="w-3 h-3 mr-1" />}
                                                    {badgeText}
                                                </Badge>
                                                <span className="text-xs text-[#7A7F86]">{Math.round(percentage)}%</span>
                                            </div>
                                        )
                                    })()}
                                </div>

                                {/* Quality Badges */}
                                <div className="flex flex-wrap gap-2">
                                    {/* Protein Quality */}
                                    {manualFood.protein > 0 && (() => {
                                        const hasCompleteProtein = (manualFood.animalProtein || 0) > 0 ||
                                                                   manualFood.name.toLowerCase().includes('meat') ||
                                                                   manualFood.name.toLowerCase().includes('fish') ||
                                                                   manualFood.name.toLowerCase().includes('chicken') ||
                                                                   manualFood.name.toLowerCase().includes('egg') ||
                                                                   manualFood.name.toLowerCase().includes('quinoa') ||
                                                                   manualFood.name.toLowerCase().includes('soy')
                                        return (
                                            <Badge variant={hasCompleteProtein ? "default" : "secondary"} className="text-xs">
                                                {hasCompleteProtein ? <Star className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                                                {hasCompleteProtein ? 'Complete Protein' : 'Incomplete Protein'}
                                            </Badge>
                                        )
                                    })()}

                                    {/* Carb Quality */}
                                    {manualFood.carbs > 0 && (() => {
                                        if (manualFood.fiber >= 3) {
                                            return (
                                                <Badge variant="default" className="text-xs">
                                                    <Star className="w-3 h-3 mr-1" />
                                                    High Fiber
                                                </Badge>
                                            )
                                        } else if (manualFood.carbs > 0 && manualFood.sugar / manualFood.carbs > 0.5) {
                                            return (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    High Sugar
                                                </Badge>
                                            )
                                        } else if (manualFood.carbs > 0 && manualFood.sugar / manualFood.carbs < 0.1) {
                                            return (
                                                <Badge variant="default" className="text-xs">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Low Sugar
                                                </Badge>
                                            )
                                        }
                                        return null
                                    })()}

                                    {/* Fat Quality */}
                                    {manualFood.fats > 0 && (() => {
                                        if (manualFood.transFat > 0) {
                                            return (
                                                <Badge variant="destructive" className="text-xs">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Contains Trans Fat
                                                </Badge>
                                            )
                                        } else if (manualFood.saturatedFat > 5) {
                                            return (
                                                <Badge variant="secondary" className="text-xs">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    High Saturated Fat
                                                </Badge>
                                            )
                                        } else if (manualFood.saturatedFat < 2 && manualFood.saturatedFat > 0) {
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

                                {/* Smart Tips */}
                                <div className="text-xs text-[#A1A1AA] space-y-1">
                                    {manualFood.fiber >= 3 && (
                                        <p className="flex items-start space-x-2">
                                            <CheckCircle className="w-3 h-3 text-[#00E676] mt-0.5 flex-shrink-0" />
                                            <span>Excellent source of fiber - supports digestive health</span>
                                        </p>
                                    )}
                                    {manualFood.transFat > 0 && (
                                        <p className="flex items-start space-x-2">
                                            <X className="w-3 h-3 text-[#EF4444] mt-0.5 flex-shrink-0" />
                                            <span className="text-[#EF4444]">Contains trans fat - avoid when possible</span>
                                        </p>
                                    )}
                                    {manualFood.saturatedFat > 0 && manualFood.saturatedFat < 2 && (
                                        <p className="flex items-start space-x-2">
                                            <Heart className="w-3 h-3 text-[#00E676] mt-0.5 flex-shrink-0" />
                                            <span>Low saturated fat - heart-healthy choice</span>
                                        </p>
                                    )}
                                    {manualFood.protein > 10 && (manualFood.animalProtein || 0) > 0 && (
                                        <p className="flex items-start space-x-2">
                                            <Beef className="w-3 h-3 text-[#2A8CEA] mt-0.5 flex-shrink-0" />
                                            <span>High in complete protein with all essential amino acids</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Optional Details */}
                        <details className="border border-[#212227] rounded-lg bg-[#121318]">
                            <summary className="p-4 cursor-pointer text-[#F3F4F6] hover:text-[#2A8CEA] transition-colors flex items-center justify-between group">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4 text-[#9BE15D]" />
                                    <span className="font-medium">Micronutrients (Optional)</span>
                                    <Badge variant="outline" className="text-[#A1A1AA] border-[#A1A1AA]/30 text-xs">
                                        Advanced
                                    </Badge>
                                </div>
                                <ChevronDown className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#2A8CEA] transition-transform group-open:rotate-180" />
                            </summary>
                            <div className="p-4 pt-4 space-y-6 border-t border-[#212227] mt-2">
                                {/* Guidance */}
                                <div className="bg-[#0E0F13] border border-[#212227] rounded-lg p-3">
                                    <p className="text-[#A1A1AA] text-xs flex items-start space-x-2">
                                        <Heart className="w-3.5 h-3.5 text-[#9BE15D] mt-0.5 flex-shrink-0" />
                                        <span>
                                            Add vitamins, electrolytes, and minerals from nutrition labels for comprehensive tracking. These help you meet daily nutritional goals.
                                        </span>
                                    </p>
                                </div>

                                {/* Electrolytes */}
                                <div className="bg-[#0E0F13] border border-[#A855F7]/20 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center space-x-2">
                                        <Zap className="w-4 h-4 text-[#A855F7]" />
                                        <h5 className="text-[#A855F7] text-sm font-medium">Electrolytes</h5>
                                        <Badge variant="outline" className="text-[#A855F7] border-[#A855F7]/30 bg-[#A855F7]/10 text-xs">
                                            Hydration
                                        </Badge>
                                    </div>
                                    <p className="text-[#7A7F86] text-xs">Critical for fluid balance, nerve signals, and muscle contractions</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Droplets className="w-3 h-3 text-[#A855F7]" />
                                                <span>Sodium (mg)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="200"
                                                value={manualFood.sodium}
                                                onChange={(e) => setManualFood({ ...manualFood, sodium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#A855F7]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Fluid & nerve function</p>
                                        </div>
                                        <div>
                                            <Label className="text-[#A1A1AA] text-sm flex items-center space-x-1">
                                                <Heart className="w-3 h-3 text-[#A855F7]" />
                                                <span>Potassium (mg)</span>
                                            </Label>
                                            <Input
                                                type="number"
                                                placeholder="300"
                                                value={manualFood.potassium}
                                                onChange={(e) => setManualFood({ ...manualFood, potassium: Number(e.target.value) })}
                                                className="bg-[#121318] border-[#A855F7]/30 text-[#F3F4F6] mt-1"
                                                min="0"
                                            />
                                            <p className="text-[#7A7F86] text-xs mt-0.5">Heart & muscle health</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vitamins */}
                                <div>
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Star className="w-4 h-4 text-[#FFA500]" />
                                        <h5 className="text-[#F3F4F6] text-sm font-medium">Vitamins</h5>
                                        <Badge variant="outline" className="text-[#FFA500] border-[#FFA500]/30 bg-[#FFA500]/10 text-xs">
                                            Micronutrients
                                        </Badge>
                                    </div>
                                    <p className="text-[#7A7F86] text-xs mb-3">Essential for immunity, energy, and cell function</p>
                                    <div className="grid grid-cols-2 gap-3">
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
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Shield className="w-4 h-4 text-[#64748B]" />
                                        <h5 className="text-[#F3F4F6] text-sm font-medium">Minerals</h5>
                                        <Badge variant="outline" className="text-[#64748B] border-[#64748B]/30 bg-[#64748B]/10 text-xs">
                                            Structural
                                        </Badge>
                                    </div>
                                    <p className="text-[#7A7F86] text-xs mb-3">Build bones, teeth, and support metabolic processes</p>
                                    <div className="grid grid-cols-2 gap-3">
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
                        </>
                        )}
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

                {/* Removed: Food Selection Section - now using auto-filled Manual Entry instead */}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:border-[#2A2B31] bg-transparent"
                    >
                        Cancel
                    </Button>

                    {activeTab === "manual" && (
                        <Button
                            onClick={handleManualSave}
                            disabled={!manualFood.name.trim()}
                            className="bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full border border-[rgba(42,140,234,0.35)] shadow-[0_8px_32px_rgba(42,140,234,0.28)] hover:shadow-[0_10px_40px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to {getMealDisplayName()}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}