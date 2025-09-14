'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getProgressImages, updateProgressImage, deleteProgressImage } from '@/lib/actions/progress-images'
import { Edit2, Trash2, Weight, Calendar, Eye, EyeOff } from 'lucide-react'
import type { ProgressImage } from '@/lib/types/database.types'

interface ProgressGalleryCompactProps {
    onDataChange?: () => void
}

export default function ProgressGalleryCompact({ onDataChange }: ProgressGalleryCompactProps) {
    const [images, setImages] = useState<ProgressImage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState<ProgressImage | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editFormData, setEditFormData] = useState({
        title: '',
        notes: '',
        weight_kg: '',
        image_type: '',
        visibility: ''
    })

    // Load progress images
    const loadData = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const imagesResult = await getProgressImages({ limit: 12 })

            if (imagesResult?.error) {
                setError(imagesResult.error)
            } else if (imagesResult?.progressImages) {
                setImages(imagesResult.progressImages)
            }
        } catch (error) {
            console.error('Failed to load progress data:', error)
            setError('Failed to load progress images')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    const handleEditImage = (image: ProgressImage) => {
        setSelectedImage(image)
        setEditFormData({
            title: image.title || '',
            notes: image.notes || '',
            weight_kg: image.weight_kg?.toString() || '',
            image_type: image.image_type,
            visibility: image.visibility
        })
        setIsEditDialogOpen(true)
    }

    const handleUpdateImage = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedImage) return

        try {
            const updates: Partial<ProgressImage> = {
                title: editFormData.title.trim() || null,
                notes: editFormData.notes.trim() || null,
                image_type: editFormData.image_type as 'progress' | 'before' | 'after' | 'current',
                visibility: editFormData.visibility as 'private' | 'public'
            }

            if (editFormData.weight_kg) {
                updates.weight_kg = parseFloat(editFormData.weight_kg)
            } else {
                updates.weight_kg = null
            }

            const result = await updateProgressImage(selectedImage.id, updates)

            if (result?.error) {
                setError(result.error)
            } else {
                setIsEditDialogOpen(false)
                loadData()
                onDataChange?.()
            }
        } catch (error) {
            console.error('Update error:', error)
            setError('Failed to update image')
        }
    }

    const handleDeleteImage = async () => {
        if (!selectedImage) return

        try {
            const result = await deleteProgressImage(selectedImage.id)

            if (result?.error) {
                setError(result.error)
            } else {
                setIsDeleteDialogOpen(false)
                setSelectedImage(null)
                loadData()
                onDataChange?.()
            }
        } catch (error) {
            console.error('Delete error:', error)
            setError('Failed to delete image')
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getImageTypeColor = (type: string) => {
        switch (type) {
            case 'before': return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
            case 'after': return 'bg-green-500/10 text-green-400 border-green-500/30'
            case 'current': return 'bg-purple-500/10 text-purple-400 border-purple-500/30'
            default: return 'bg-[#4AA7FF]/10 text-[#4AA7FF] border-[#4AA7FF]/30'
        }
    }

    if (isLoading) {
        return (
            <div className="p-8 text-center">
                <div className="text-[#9CA3AF]">Loading progress images...</div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                    {error}
                </div>
            )}

            {images.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-[#9CA3AF] mb-2">No progress photos yet</div>
                    <div className="text-sm text-[#6B7280]">
                        Upload your first progress photo to get started
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((image) => (
                        <div key={image.id} className="relative group">
                            <div className="relative overflow-hidden rounded-lg bg-[#0E0F13] border border-[#212227] aspect-square">
                                {image.image_url ? (
                                    <Image
                                        src={image.image_url}
                                        alt={image.title || 'Progress photo'}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 33vw"
                                        className="object-cover transition-transform group-hover:scale-105"
                                        priority={false}
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[#6B7280]">
                                        No Image Available
                                    </div>
                                )}

                                {/* Overlay with actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleEditImage(image)}
                                        className="bg-[#121318] border-[#212227] text-[#F3F4F6] hover:bg-[#2A8CEA] hover:text-white hover:border-[#2A8CEA] h-7 w-7 p-0"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedImage(image)
                                            setIsDeleteDialogOpen(true)
                                        }}
                                        className="bg-[#121318] border-[#212227] text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 h-7 w-7 p-0"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>

                                {/* Type and visibility badges */}
                                <div className="absolute top-1 left-1 flex space-x-1">
                                    <Badge className={`${getImageTypeColor(image.image_type)} text-[10px] px-1 py-0`}>
                                        {image.image_type}
                                    </Badge>
                                    <Badge className={`text-[10px] px-1 py-0 ${image.visibility === 'public' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                        {image.visibility === 'public' ? <Eye className="w-2 h-2" /> : <EyeOff className="w-2 h-2" />}
                                    </Badge>
                                </div>
                            </div>

                            {/* Image info */}
                            <div className="p-3 space-y-2 bg-[#0E0F13]/50">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-[#F3F4F6] truncate text-sm">
                                        {image.title || 'Untitled'}
                                    </h3>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center text-xs text-[#9CA3AF]">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {formatDate(image.created_at)}
                                    </div>
                                    {image.weight_kg && (
                                        <div className="flex items-center text-xs text-[#9CA3AF]">
                                            <Weight className="w-3 h-3 mr-1" />
                                            {image.weight_kg} kg
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Show total count */}
            {images.length > 0 && (
                <div className="text-center">
                    <div className="text-xs text-[#9CA3AF]">
                        Showing {images.length} photos
                    </div>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#121318] border-[#212227] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-lg z-[9999]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6] text-xl font-bold">
                            Edit Progress Photo
                        </DialogTitle>
                        <DialogDescription className="text-[#9CA3AF]">
                            Update your progress photo details.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateImage} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#F3F4F6]">Photo Type</Label>
                                <Select
                                    value={editFormData.image_type}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, image_type: value })}
                                >
                                    <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121318] border-[#212227]">
                                        <SelectItem value="progress" className="text-[#F3F4F6] focus:bg-[#0E0F13]">Progress</SelectItem>
                                        <SelectItem value="before" className="text-[#F3F4F6] focus:bg-[#0E0F13]">Before</SelectItem>
                                        <SelectItem value="after" className="text-[#F3F4F6] focus:bg-[#0E0F13]">After</SelectItem>
                                        <SelectItem value="current" className="text-[#F3F4F6] focus:bg-[#0E0F13]">Current</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#F3F4F6]">Visibility</Label>
                                <Select
                                    value={editFormData.visibility}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, visibility: value })}
                                >
                                    <SelectTrigger className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121318] border-[#212227]">
                                        <SelectItem value="private" className="text-[#F3F4F6] focus:bg-[#0E0F13]">Private</SelectItem>
                                        <SelectItem value="public" className="text-[#F3F4F6] focus:bg-[#0E0F13]">Public</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#F3F4F6]">Title</Label>
                                <Input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#9CA3AF] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#F3F4F6]">Weight (kg)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1000"
                                    value={editFormData.weight_kg}
                                    onChange={(e) => setEditFormData({ ...editFormData, weight_kg: e.target.value })}
                                    className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#9CA3AF] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#F3F4F6]">Notes</Label>
                            <Textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                rows={3}
                                className="bg-[#0E0F13] border-[#212227] text-[#F3F4F6] placeholder-[#9CA3AF] focus:border-[#2A8CEA] focus:ring-[#2A8CEA] rounded-xl resize-none"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="rounded-full border-[#212227] bg-transparent text-[#F3F4F6] hover:bg-white/5 hover:text-white hover:border-[#2A2B31]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-full bg-gradient-to-r from-[#2A8CEA] via-[#1659BF] to-[#103E9A] text-white border border-[rgba(42,140,234,0.35)] shadow-[0_4px_16px_rgba(42,140,234,0.28)] hover:shadow-[0_6px_24px_rgba(42,140,234,0.35)] hover:scale-[1.01] active:scale-[0.997] transition-all"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-[#121318] border-[#212227] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-md z-[9999]">
                    <DialogHeader>
                        <DialogTitle className="text-[#F3F4F6] text-xl font-bold">
                            Delete Progress Photo
                        </DialogTitle>
                        <DialogDescription className="text-[#9CA3AF]">
                            Are you sure you want to delete this progress photo? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="rounded-full border-[#212227] bg-transparent text-[#F3F4F6] hover:bg-white/5 hover:text-white hover:border-[#2A2B31]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteImage}
                            className="rounded-full bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#121318] transition-all"
                        >
                            Delete Photo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}