"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Coffee, Sandwich, ChefHat, Cookie, Apple, Utensils, Pizza, Salad, Croissant, IceCream, Sun, Moon, Cake, Beef, Fish, Soup, Trash2 } from "lucide-react"
import { Meal, MealTemplate } from "@/lib/nutrition-storage"

interface CreateMealDialogProps {
    isOpen: boolean
    onClose: () => void
    onMealCreated: (meal: Meal) => void
    existingTemplates: MealTemplate[]
    maxMealsReached: boolean
    onTemplateDeleted?: (templateId: string) => void
}

const availableIcons = [
    { name: 'Coffee', icon: Coffee, label: 'Coffee' },
    { name: 'Sandwich', icon: Sandwich, label: 'Sandwich' },
    { name: 'ChefHat', icon: ChefHat, label: 'Chef Hat' },
    { name: 'Cookie', icon: Cookie, label: 'Cookie' },
    { name: 'Apple', icon: Apple, label: 'Apple' },
    { name: 'Utensils', icon: Utensils, label: 'Utensils' },
    { name: 'Pizza', icon: Pizza, label: 'Pizza' },
    { name: 'Salad', icon: Salad, label: 'Salad' },
    { name: 'Croissant', icon: Croissant, label: 'Croissant' },
    { name: 'IceCream', icon: IceCream, label: 'Ice Cream' },
    { name: 'Sun', icon: Sun, label: 'Sun' },
    { name: 'Moon', icon: Moon, label: 'Moon' },
    { name: 'Cake', icon: Cake, label: 'Cake' },
    { name: 'Beef', icon: Beef, label: 'Beef' },
    { name: 'Fish', icon: Fish, label: 'Fish' },
    { name: 'Soup', icon: Soup, label: 'Soup' }
]

export function CreateMealDialog({ isOpen, onClose, onMealCreated, existingTemplates, maxMealsReached, onTemplateDeleted }: CreateMealDialogProps) {
    const [selectedTab, setSelectedTab] = useState<'create' | 'templates'>('create')
    const [mealName, setMealName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState<string>('Utensils')
    const [selectedTemplate, setSelectedTemplate] = useState<string>('')
    const [isLoading, setIsLoading] = useState(false)

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setMealName('')
            setSelectedIcon('Utensils')
            setSelectedTemplate('')
            setSelectedTab(existingTemplates.length > 0 ? 'templates' : 'create')
        }
    }, [isOpen, existingTemplates.length])

    const handleCreateMeal = async () => {
        if (!mealName.trim()) return

        setIsLoading(true)
        try {
            const newMeal: Meal = {
                id: `meal-custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'custom',
                name: mealName.trim(),
                icon: selectedIcon,
                foods: [],
                totalCalories: 0,
                totalMacros: { carbs: 0, protein: 0, fats: 0 }
            }

            onMealCreated(newMeal)
            onClose()
        } catch (error) {
            console.error('Error creating meal:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleUseTemplate = async () => {
        if (!selectedTemplate) return

        const template = existingTemplates.find(t => t.id === selectedTemplate)
        if (!template) return

        setIsLoading(true)
        try {
            const newMeal: Meal = {
                id: `meal-template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: 'custom',
                name: template.name,
                icon: template.icon,
                foods: [], // Start with empty foods, user can add items from the meal card
                totalCalories: 0,
                totalMacros: { carbs: 0, protein: 0, fats: 0 }
            }

            onMealCreated(newMeal)
            onClose()
        } catch (error) {
            console.error('Error creating meal from template:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteTemplate = async (templateId: string) => {
        if (!onTemplateDeleted) return

        try {
            onTemplateDeleted(templateId)
            // Reset selected template if it was the one being deleted
            if (selectedTemplate === templateId) {
                setSelectedTemplate('')
            }
        } catch (error) {
            console.error('Error deleting template:', error)
        }
    }

    const getIconComponent = (iconName: string) => {
        const iconData = availableIcons.find(icon => icon.name === iconName)
        if (!iconData) return <Utensils className="w-5 h-5" />
        const IconComponent = iconData.icon
        return <IconComponent className="w-5 h-5" />
    }

    if (maxMealsReached) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="bg-[#121318] border border-[#212227] text-[#F3F4F6] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6]">Maximum Meals Reached</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-[#A1A1AA]">
                            You&apos;ve reached the maximum of 6 meals for today. Please remove a meal before creating a new one.
                        </p>
                        <Button
                            onClick={onClose}
                            className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full"
                        >
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#121318] border border-[#212227] text-[#F3F4F6] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-[#F3F4F6]">Add New Meal</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Tab Selection */}
                    <div className="flex bg-[#0E0F13] rounded-lg p-1">
                        <button
                            onClick={() => setSelectedTab('create')}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                selectedTab === 'create'
                                    ? 'bg-[#121318] text-[#F3F4F6] shadow-sm'
                                    : 'text-[#A1A1AA] hover:text-[#F3F4F6]'
                            }`}
                        >
                            Create New
                        </button>
                        <button
                            onClick={() => setSelectedTab('templates')}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                                selectedTab === 'templates'
                                    ? 'bg-[#121318] text-[#F3F4F6] shadow-sm'
                                    : 'text-[#A1A1AA] hover:text-[#F3F4F6]'
                            }`}
                            disabled={existingTemplates.length === 0}
                        >
                            Templates ({existingTemplates.length})
                        </button>
                    </div>

                    {selectedTab === 'create' ? (
                        <div className="space-y-4">
                            {/* Meal Name */}
                            <div className="space-y-2">
                                <Label htmlFor="meal-name" className="text-[#F3F4F6]">Meal Name</Label>
                                <Input
                                    id="meal-name"
                                    value={mealName}
                                    onChange={(e) => setMealName(e.target.value)}
                                    placeholder="Enter meal name..."
                                    className="bg-[#0E0F13] border border-[#2A2B31] text-[#F3F4F6] placeholder:text-[#7A7F86] focus:border-[#2A8CEA] focus:ring-1 focus:ring-[#2A8CEA]"
                                />
                            </div>

                            {/* Icon Selection */}
                            <div className="space-y-2">
                                <Label className="text-[#F3F4F6]">Icon</Label>
                                <div className="grid grid-cols-8 gap-2">
                                    {availableIcons.map((iconData) => (
                                        <button
                                            key={iconData.name}
                                            onClick={() => setSelectedIcon(iconData.name)}
                                            className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-colors ${
                                                selectedIcon === iconData.name
                                                    ? 'border-[#2A8CEA] bg-[#2A8CEA]/10 text-[#2A8CEA]'
                                                    : 'border-[#2A2B31] bg-[#0E0F13] text-[#A1A1AA] hover:border-[#4A5A6F] hover:text-[#F3F4F6]'
                                            }`}
                                            title={iconData.label}
                                        >
                                            <iconData.icon className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="p-3 bg-[#0E0F13] border border-[#2A2B31] rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center text-[#F3F4F6]">
                                        {getIconComponent(selectedIcon)}
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-[#F3F4F6]">{mealName || 'Meal Name'}</h3>
                                        <p className="text-xs text-[#A1A1AA]">0 cal • 0 items</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={handleCreateMeal}
                                disabled={!mealName.trim() || isLoading}
                                className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full disabled:opacity-50"
                            >
                                {isLoading ? 'Creating...' : 'Create Meal'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {existingTemplates.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[#A1A1AA]">No meal templates saved yet.</p>
                                    <p className="text-xs text-[#7A7F86] mt-1">Create your first custom meal to save it as a template.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <Label className="text-[#F3F4F6]">Saved Templates</Label>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {existingTemplates.map((template) => (
                                                <div
                                                    key={template.id}
                                                    className={`p-3 bg-[#0E0F13] border rounded-lg cursor-pointer transition-colors group ${
                                                        selectedTemplate === template.id
                                                            ? 'border-[#2A8CEA] bg-[#2A8CEA]/10'
                                                            : 'border-[#2A2B31] hover:border-[#4A5A6F]'
                                                    }`}
                                                    onClick={() => setSelectedTemplate(template.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 bg-[rgba(255,255,255,0.03)] border border-[#2A2B31] rounded-lg flex items-center justify-center text-[#F3F4F6]">
                                                                {getIconComponent(template.icon)}
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-[#F3F4F6]">{template.name}</h3>
                                                                <p className="text-xs text-[#A1A1AA]">{template.foods.length} foods in template</p>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteTemplate(template.id)
                                                            }}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-full w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleUseTemplate}
                                        disabled={!selectedTemplate || isLoading}
                                        className="w-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white rounded-full disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating...' : 'Use Template'}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}