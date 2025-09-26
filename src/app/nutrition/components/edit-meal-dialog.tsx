"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Meal } from "@/lib/nutrition-storage"
import { Edit3, X, Coffee, Sandwich, ChefHat, Cookie, Apple, Utensils, Pizza, Salad, Croissant, IceCream } from "lucide-react"

interface EditMealDialogProps {
    isOpen: boolean
    onClose: () => void
    meal: Meal
    onMealUpdated: (updatedMeal: Meal) => Promise<void>
}

// Available meal icons
const MEAL_ICONS = [
    { name: 'Coffee', component: Coffee, label: 'Coffee' },
    { name: 'Sandwich', component: Sandwich, label: 'Sandwich' },
    { name: 'ChefHat', component: ChefHat, label: 'Chef Hat' },
    { name: 'Cookie', component: Cookie, label: 'Snacks' },
    { name: 'Apple', component: Apple, label: 'Apple' },
    { name: 'Utensils', component: Utensils, label: 'Utensils' },
    { name: 'Pizza', component: Pizza, label: 'Pizza' },
    { name: 'Salad', component: Salad, label: 'Salad' },
    { name: 'Croissant', component: Croissant, label: 'Croissant' },
    { name: 'IceCream', component: IceCream, label: 'Ice Cream' }
]

export function EditMealDialog({ isOpen, onClose, meal, onMealUpdated }: EditMealDialogProps) {
    const [name, setName] = useState(meal.name)
    const [selectedIcon, setSelectedIcon] = useState(meal.icon || 'Utensils')
    const [isLoading, setIsLoading] = useState(false)

    // Reset form when meal changes
    useEffect(() => {
        setName(meal.name)
        setSelectedIcon(meal.icon || 'Utensils')
    }, [meal])

    const handleSave = async () => {
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const updatedMeal: Meal = {
                ...meal,
                name: name.trim(),
                icon: selectedIcon
            }

            await onMealUpdated(updatedMeal)
            onClose()
        } catch (error) {
            console.error('Error updating meal:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getIconComponent = (iconName: string) => {
        const iconData = MEAL_ICONS.find(icon => icon.name === iconName)
        if (iconData) {
            const IconComponent = iconData.component
            return <IconComponent className="w-5 h-5" />
        }
        return <Utensils className="w-5 h-5" />
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#9BE15D] to-[#00E676] rounded-full flex items-center justify-center">
                                <Edit3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-[#F3F4F6]">
                                    Edit Meal
                                </DialogTitle>
                                <p className="text-sm text-[#A1A1AA]">
                                    Customize your meal name and icon
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            size="icon"
                            className="text-[#A1A1AA] hover:text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.04)] rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Meal Name Input */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-[#F3F4F6]">
                            Meal Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter meal name..."
                            className="bg-[#121318] border-[#212227] text-[#F3F4F6] focus:border-[#9BE15D]"
                        />
                    </div>

                    {/* Icon Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium text-[#F3F4F6]">
                            Choose Icon
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                            {MEAL_ICONS.map((icon) => (
                                <Button
                                    key={icon.name}
                                    onClick={() => setSelectedIcon(icon.name)}
                                    variant="ghost"
                                    className={`
                                        h-12 w-12 rounded-[12px] flex items-center justify-center transition-all
                                        ${selectedIcon === icon.name
                                            ? 'bg-gradient-to-br from-[#9BE15D] to-[#00E676] text-white'
                                            : 'bg-[#121318] border border-[#212227] text-[#A1A1AA] hover:text-[#F3F4F6] hover:border-[#2A2B31]'
                                        }
                                    `}
                                    title={icon.label}
                                >
                                    <icon.component className="w-5 h-5" />
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-[#0E0F13] border border-[#212227] rounded-[12px] p-4">
                        <h4 className="text-sm font-medium text-[#F3F4F6] mb-3">Preview</h4>
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-[10px] flex items-center justify-center text-[#F3F4F6]">
                                {getIconComponent(selectedIcon)}
                            </div>
                            <div>
                                <p className="font-medium text-[#F3F4F6]">{name || 'Meal Name'}</p>
                                <p className="text-xs text-[#A1A1AA]">{meal.totalCalories} cal • {meal.foods.length} items</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={onClose}
                        variant="secondary"
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-gradient-to-r from-[#9BE15D] to-[#00E676] text-[#0B0B0F] rounded-full hover:shadow-lg disabled:opacity-50"
                        disabled={isLoading || !name.trim()}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}