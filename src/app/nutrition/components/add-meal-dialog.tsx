"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { NutritionStorage, Food, DetailedNutrients } from "@/lib/nutrition-storage"
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
    const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)

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
        cholesterol: 0
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

    // Search for foods
    useEffect(() => {
        const searchFoods = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([])
                return
            }

            setIsSearching(true)
            try {
                const foods = await NutritionStorage.getFoods(searchQuery, 20)
                setSearchResults(foods.map(food => ({
                    id: food.id,
                    name: food.name,
                    brand: food.brand,
                    caloriesPerServing: food.caloriesPerServing,
                    servingSize: food.servingSize,
                    servingUnit: food.servingUnit,
                    macros: food.macros,
                    isUserCreated: food.isUserCreated
                })))
            } catch (error) {
                console.error('Error searching foods:', error)
                notifications.error('Search failed', {
                    description: 'Unable to search for foods. Please try again.',
                    duration: 3000
                })
            } finally {
                setIsSearching(false)
            }
        }

        const debounceTimer = setTimeout(searchFoods, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery, notifications])

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
                cholesterol: manualFood.cholesterol || undefined
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
        setSearchResults([])
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
            cholesterol: 0
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
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] w-4 h-4" />
                            <Input
                                placeholder="Search foods from USDA database (e.g., 'chicken breast', 'banana')..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-[#121318] border-[#212227] text-[#F3F4F6] placeholder-[#7A7F86]"
                            />
                        </div>

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
                                                        {isUserFood && (
                                                            <Badge variant="outline" className="text-[#2A8CEA] border-[#2A8CEA]/30 bg-[#2A8CEA]/10 text-xs">
                                                                <Database className="w-3 h-3 mr-1" />
                                                                Custom
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {food.brand && (
                                                        <p className="text-xs text-[#A1A1AA] mb-1">{food.brand}</p>
                                                    )}
                                                    <div className="flex items-center space-x-4 text-xs text-[#7A7F86]">
                                                        <span className="font-medium">{food.caloriesPerServing} cal</span>
                                                        <span className="text-[#9BE15D]">{formatNutrientValue(food.macros.carbs)}g carbs</span>
                                                        <span className="text-[#2A8CEA]">{formatNutrientValue(food.macros.protein)}g protein</span>
                                                        <span className="text-[#FF2D55]">{formatNutrientValue(food.macros.fats)}g fats</span>
                                                        {food.macros.fiber && food.macros.fiber > 0 && (
                                                            <span className="text-[#A1A1AA]">{formatNutrientValue(food.macros.fiber)}g fiber</span>
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
                                <div className="text-center py-8">
                                    <Package className="w-8 h-8 text-[#A1A1AA] mx-auto mb-2" />
                                    <p className="text-[#A1A1AA] text-sm">No foods found</p>
                                    <p className="text-[#7A7F86] text-xs mt-1">Try different keywords or add manually</p>
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
                            <div className="p-3 pt-0 space-y-3">
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                        <Label className="text-[#A1A1AA] text-sm">Cholesterol (mg)</Label>
                                        <Input
                                            type="number"
                                            value={manualFood.cholesterol}
                                            onChange={(e) => setManualFood({ ...manualFood, cholesterol: Number(e.target.value) })}
                                            className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                            min="0"
                                        />
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

                                    {/* Vitamins & Minerals - Complete List */}
                                    {Object.entries(selectedFood.macros).some(([key, value]) =>
                                        ['vitaminA', 'vitaminC', 'vitaminD', 'vitaminE', 'vitaminK', 'thiamine', 'riboflavin', 'niacin', 'vitaminB6', 'folate', 'vitaminB12', 'biotin', 'pantothenicAcid', 'calcium', 'iron', 'potassium', 'phosphorus', 'iodine', 'magnesium', 'zinc', 'selenium', 'copper', 'manganese', 'chromium', 'molybdenum'].includes(key) && value && value > 0
                                    ) && (
                                        <div>
                                            <h6 className="text-xs font-medium text-[#2A8CEA] mb-2">Vitamins & Minerals</h6>
                                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                                {/* Fat-Soluble Vitamins */}
                                                {selectedFood.macros.vitaminA && selectedFood.macros.vitaminA > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminA * (weightGrams / selectedFood.servingSize))}IU
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin A</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminD && selectedFood.macros.vitaminD > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminD * (weightGrams / selectedFood.servingSize))}IU
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin D</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminE && selectedFood.macros.vitaminE > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminE * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin E</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminK && selectedFood.macros.vitaminK > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminK * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin K</div>
                                                    </div>
                                                )}

                                                {/* Water-Soluble Vitamins */}
                                                {selectedFood.macros.vitaminC && selectedFood.macros.vitaminC > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminC * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin C</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.thiamine && selectedFood.macros.thiamine > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.thiamine * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">thiamine (B1)</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.riboflavin && selectedFood.macros.riboflavin > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.riboflavin * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">riboflavin (B2)</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.niacin && selectedFood.macros.niacin > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.niacin * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">niacin (B3)</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminB6 && selectedFood.macros.vitaminB6 > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminB6 * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin B6</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.folate && selectedFood.macros.folate > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.folate * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">folate</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminB12 && selectedFood.macros.vitaminB12 > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.vitaminB12 * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin B12</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.biotin && selectedFood.macros.biotin > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.biotin * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">biotin</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.pantothenicAcid && selectedFood.macros.pantothenicAcid > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.pantothenicAcid * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">pantothenic acid</div>
                                                    </div>
                                                )}

                                                {/* Major Minerals */}
                                                {selectedFood.macros.calcium && selectedFood.macros.calcium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.calcium * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">calcium</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.iron && selectedFood.macros.iron > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.iron * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">iron</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.potassium && selectedFood.macros.potassium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.potassium * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">potassium</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.phosphorus && selectedFood.macros.phosphorus > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.phosphorus * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">phosphorus</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.magnesium && selectedFood.macros.magnesium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.magnesium * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">magnesium</div>
                                                    </div>
                                                )}

                                                {/* Trace Minerals */}
                                                {selectedFood.macros.zinc && selectedFood.macros.zinc > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.zinc * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">zinc</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.selenium && selectedFood.macros.selenium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.selenium * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">selenium</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.copper && selectedFood.macros.copper > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.copper * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">copper</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.manganese && selectedFood.macros.manganese > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.manganese * (weightGrams / selectedFood.servingSize))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">manganese</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.iodine && selectedFood.macros.iodine > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.iodine * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">iodine</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.chromium && selectedFood.macros.chromium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.chromium * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">chromium</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.molybdenum && selectedFood.macros.molybdenum > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {formatNutrientValue(selectedFood.macros.molybdenum * (weightGrams / selectedFood.servingSize))}mcg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">molybdenum</div>
                                                    </div>
                                                )}
                                            </div>
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