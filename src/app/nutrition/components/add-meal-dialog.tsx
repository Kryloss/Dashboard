"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { NutritionStorage, Food, DetailedNutrients } from "@/lib/nutrition-storage"
import { Search, X, Plus, Package, Edit3, Calculator, Database, Leaf, ChevronDown, ChevronUp } from "lucide-react"
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
    const [quantity, setQuantity] = useState(1)
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
        setQuantity(1)
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

            await onFoodAdded(food, quantity, notes.trim() || undefined)

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
            await onFoodAdded(selectedFood, quantity, notes.trim() || undefined)

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
        setQuantity(1)
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

    const calculateAdjustedNutrition = (food: Food | typeof manualFood, qty: number) => {
        const calories = 'caloriesPerServing' in food ? food.caloriesPerServing : food.calories
        const carbs = 'macros' in food ? food.macros.carbs : food.carbs
        const protein = 'macros' in food ? food.macros.protein : food.protein
        const fats = 'macros' in food ? food.macros.fats : food.fats

        return {
            calories: Math.round(calories * qty),
            carbs: (carbs * qty).toFixed(1),
            protein: (protein * qty).toFixed(1),
            fats: (fats * qty).toFixed(1)
        }
    }

    const hasDetailedNutrients = (macros: DetailedNutrients) => {
        return !!(
            macros.fiber || macros.sugar || macros.sodium ||
            macros.saturatedFat || macros.cholesterol ||
            macros.vitaminA || macros.vitaminC || macros.calcium ||
            macros.iron || macros.potassium || macros.vitaminD
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
                                                        <span className="text-[#9BE15D]">{Math.round(food.macros.carbs * 10) / 10}g carbs</span>
                                                        <span className="text-[#2A8CEA]">{Math.round(food.macros.protein * 10) / 10}g protein</span>
                                                        <span className="text-[#FF2D55]">{Math.round(food.macros.fats * 10) / 10}g fats</span>
                                                        {food.macros.fiber && food.macros.fiber > 0 && (
                                                            <span className="text-[#A1A1AA]">{Math.round(food.macros.fiber * 10) / 10}g fiber</span>
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
                                <Label className="text-[#F3F4F6] text-sm font-medium">Quantity</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(0.1, Number(e.target.value)))}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6]"
                                        min="0.1"
                                        step="0.1"
                                    />
                                    <span className="text-[#A1A1AA] text-sm whitespace-nowrap">
                                        × {selectedFood.servingSize}{selectedFood.servingUnit}
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
                                    <h5 className="text-[#F3F4F6] font-medium">Nutrition for {quantity} serving{quantity !== 1 ? 's' : ''}</h5>
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
                                        {calculateAdjustedNutrition(selectedFood, quantity).calories}
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">calories</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#9BE15D]">
                                        {calculateAdjustedNutrition(selectedFood, quantity).carbs}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">carbs</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#2A8CEA]">
                                        {calculateAdjustedNutrition(selectedFood, quantity).protein}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">protein</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-[#FF2D55]">
                                        {calculateAdjustedNutrition(selectedFood, quantity).fats}g
                                    </div>
                                    <div className="text-xs text-[#A1A1AA]">fats</div>
                                </div>
                            </div>

                            {/* Detailed Nutrition Panel */}
                            {showDetailedNutrition && hasDetailedNutrients(selectedFood.macros) && (
                                <div className="border-t border-[#212227] pt-3 mt-3">
                                    <h6 className="text-sm font-medium text-[#F3F4F6] mb-3">Detailed Nutrition</h6>

                                    {/* Other Macros */}
                                    <div className="grid grid-cols-3 gap-4 text-center text-sm mb-4">
                                        {selectedFood.macros.fiber && selectedFood.macros.fiber > 0 && (
                                            <div>
                                                <div className="font-semibold text-[#A1A1AA]">
                                                    {Math.round((selectedFood.macros.fiber * quantity) * 10) / 10}g
                                                </div>
                                                <div className="text-xs text-[#7A7F86]">fiber</div>
                                            </div>
                                        )}
                                        {selectedFood.macros.sugar && selectedFood.macros.sugar > 0 && (
                                            <div>
                                                <div className="font-semibold text-[#A1A1AA]">
                                                    {Math.round((selectedFood.macros.sugar * quantity) * 10) / 10}g
                                                </div>
                                                <div className="text-xs text-[#7A7F86]">sugar</div>
                                            </div>
                                        )}
                                        {selectedFood.macros.sodium && selectedFood.macros.sodium > 0 && (
                                            <div>
                                                <div className="font-semibold text-[#A1A1AA]">
                                                    {Math.round((selectedFood.macros.sodium * quantity))}mg
                                                </div>
                                                <div className="text-xs text-[#7A7F86]">sodium</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Fats Breakdown */}
                                    {(selectedFood.macros.saturatedFat || selectedFood.macros.cholesterol) && (
                                        <div className="mb-4">
                                            <h6 className="text-xs font-medium text-[#FF2D55] mb-2">Fats Breakdown</h6>
                                            <div className="grid grid-cols-2 gap-4 text-center text-sm">
                                                {selectedFood.macros.saturatedFat && selectedFood.macros.saturatedFat > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.saturatedFat * quantity) * 10) / 10}g
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">saturated fat</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.cholesterol && selectedFood.macros.cholesterol > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.cholesterol * quantity))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">cholesterol</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Vitamins & Minerals */}
                                    {(selectedFood.macros.vitaminA || selectedFood.macros.vitaminC || selectedFood.macros.calcium || selectedFood.macros.iron || selectedFood.macros.vitaminD || selectedFood.macros.potassium) && (
                                        <div>
                                            <h6 className="text-xs font-medium text-[#2A8CEA] mb-2">Vitamins & Minerals</h6>
                                            <div className="grid grid-cols-3 gap-4 text-center text-sm">
                                                {selectedFood.macros.vitaminA && selectedFood.macros.vitaminA > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.vitaminA * quantity))}IU
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin A</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminC && selectedFood.macros.vitaminC > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.vitaminC * quantity) * 10) / 10}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin C</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.vitaminD && selectedFood.macros.vitaminD > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.vitaminD * quantity))}IU
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">vitamin D</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.calcium && selectedFood.macros.calcium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.calcium * quantity))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">calcium</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.iron && selectedFood.macros.iron > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.iron * quantity) * 10) / 10}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">iron</div>
                                                    </div>
                                                )}
                                                {selectedFood.macros.potassium && selectedFood.macros.potassium > 0 && (
                                                    <div>
                                                        <div className="font-semibold text-[#A1A1AA]">
                                                            {Math.round((selectedFood.macros.potassium * quantity))}mg
                                                        </div>
                                                        <div className="text-xs text-[#7A7F86]">potassium</div>
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