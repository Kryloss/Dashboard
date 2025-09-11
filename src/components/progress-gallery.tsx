'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Badge } from '@/components/ui/badge'
import { getProgressImages, updateProgressImage, deleteProgressImage, getProgressStats } from '@/lib/actions/progress-images'
import { Edit2, Trash2, Weight, Calendar, Eye, EyeOff, Filter, TrendingUp } from 'lucide-react'
import type { ProgressImage } from '@/lib/types/database.types'

interface ProgressGalleryProps {
    onDataChange?: () => void
}

interface ProgressStats {
    totalImages: number
    weightChange: number | null
    firstImageDate?: string
    latestImageDate?: string
    imagesByType: Record<string, number>
}

export default function ProgressGallery({ onDataChange }: ProgressGalleryProps) {
    const [images, setImages] = useState<ProgressImage[]>([])
    const [stats, setStats] = useState<ProgressStats | null>(null)
    const [filteredImages, setFilteredImages] = useState<ProgressImage[]>([])
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
    const [filters, setFilters] = useState({
        imageType: 'all',
        startDate: '',
        endDate: '',
        limit: 50
    })

    // Load progress images and stats
    const loadData = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const [imagesResult, statsResult] = await Promise.all([
                getProgressImages(filters.imageType === 'all' ? undefined : {
                    imageType: filters.imageType,
                    startDate: filters.startDate || undefined,
                    endDate: filters.endDate || undefined,
                    limit: filters.limit
                }),
                getProgressStats()
            ])

            if (imagesResult?.error) {
                setError(imagesResult.error)
            } else if (imagesResult?.progressImages) {
                setImages(imagesResult.progressImages)
                setFilteredImages(imagesResult.progressImages)
            }

            if (statsResult?.error) {
                console.error('Stats error:', statsResult.error)
            } else if (statsResult?.stats) {
                setStats(statsResult.stats)
            }
        } catch (error) {
            console.error('Failed to load progress data:', error)
            setError('Failed to load progress images')
        } finally {
            setIsLoading(false)
        }
    }, [filters])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Apply filters when they change
    useEffect(() => {
        let filtered = images

        if (filters.imageType !== 'all') {
            filtered = filtered.filter(img => img.image_type === filters.imageType)
        }

        if (filters.startDate) {
            filtered = filtered.filter(img => new Date(img.created_at) >= new Date(filters.startDate))
        }

        if (filters.endDate) {
            filtered = filtered.filter(img => new Date(img.created_at) <= new Date(filters.endDate))
        }

        setFilteredImages(filtered)
    }, [images, filters])

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
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                <CardContent className="p-8 text-center">
                    <div className="text-[#9CA9B7]">Loading progress images...</div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Progress Stats */}
            {stats && (
                <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                    <div
                        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                        style={{
                            background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                        }}
                    />
                    <CardHeader>
                        <CardTitle className="text-[#FBF7FA] text-lg font-bold flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2" />
                            Progress Statistics
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-[#4AA7FF]">{stats.totalImages}</div>
                                <div className="text-sm text-[#9CA9B7]">Total Photos</div>
                            </div>
                            {stats.weightChange !== null && (
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${stats.weightChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.weightChange >= 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
                                    </div>
                                    <div className="text-sm text-[#9CA9B7]">Weight Change</div>
                                </div>
                            )}
                            <div className="text-center">
                                <div className="text-lg font-semibold text-[#FBF7FA]">
                                    {stats.firstImageDate ? formatDate(stats.firstImageDate) : 'N/A'}
                                </div>
                                <div className="text-sm text-[#9CA9B7]">First Photo</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-[#FBF7FA]">
                                    {stats.latestImageDate ? formatDate(stats.latestImageDate) : 'N/A'}
                                </div>
                                <div className="text-sm text-[#9CA9B7]">Latest Photo</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-[#FBF7FA] text-lg font-bold flex items-center">
                        <Filter className="w-5 h-5 mr-2" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[#FBF7FA]">Photo Type</Label>
                            <Select
                                value={filters.imageType}
                                onValueChange={(value) => setFilters({ ...filters, imageType: value })}
                            >
                                <SelectTrigger className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#121922] border-[#2A3442]">
                                    <SelectItem value="all" className="text-[#FBF7FA] focus:bg-[#0F101A]">All Types</SelectItem>
                                    <SelectItem value="progress" className="text-[#FBF7FA] focus:bg-[#0F101A]">Progress</SelectItem>
                                    <SelectItem value="before" className="text-[#FBF7FA] focus:bg-[#0F101A]">Before</SelectItem>
                                    <SelectItem value="after" className="text-[#FBF7FA] focus:bg-[#0F101A]">After</SelectItem>
                                    <SelectItem value="current" className="text-[#FBF7FA] focus:bg-[#0F101A]">Current</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#FBF7FA]">Start Date</Label>
                            <Input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#FBF7FA]">End Date</Label>
                            <Input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                            />
                        </div>

                        <div className="flex items-end">
                            <Button
                                onClick={() => setFilters({ imageType: 'all', startDate: '', endDate: '', limit: 50 })}
                                variant="outline"
                                className="w-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] rounded-xl"
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Gallery */}
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                    style={{
                        background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                    }}
                />
                <CardHeader>
                    <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                        Progress Gallery
                    </CardTitle>
                    <CardDescription className="text-[#9CA9B7]">
                        {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'} found
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm mb-6">
                            {error}
                        </div>
                    )}

                    {filteredImages.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-[#9CA9B7] mb-2">No progress photos found</div>
                            <div className="text-sm text-[#556274]">
                                {filters.imageType !== 'all' || filters.startDate || filters.endDate
                                    ? 'Try adjusting your filters or upload your first progress photo'
                                    : 'Upload your first progress photo to get started'
                                }
                            </div>
                        </div>
                    ) : (
                        <Carousel className="w-full">
                            <CarouselContent className="-ml-4">
                                {filteredImages.map((image) => (
                                    <CarouselItem key={image.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                        <div className="relative group">
                                            <div className="relative overflow-hidden rounded-xl bg-[#0F101A] border border-[#2A3442]">
                                                <Image
                                                    src={image.image_url}
                                                    alt={image.title || 'Progress photo'}
                                                    width={400}
                                                    height={256}
                                                    className="w-full h-64 object-cover transition-transform group-hover:scale-105"
                                                />

                                                {/* Overlay with actions */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditImage(image)}
                                                        className="bg-[#121922] border-[#2A3442] text-[#FBF7FA] hover:bg-[#4AA7FF] hover:text-white hover:border-[#4AA7FF]"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedImage(image)
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                        className="bg-[#121922] border-[#2A3442] text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                {/* Type and visibility badges */}
                                                <div className="absolute top-2 left-2 flex space-x-2">
                                                    <Badge className={`${getImageTypeColor(image.image_type)} text-xs`}>
                                                        {image.image_type}
                                                    </Badge>
                                                    <Badge className={`text-xs ${image.visibility === 'public' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}`}>
                                                        {image.visibility === 'public' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Image info */}
                                            <div className="p-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-[#FBF7FA] truncate">
                                                        {image.title || 'Untitled'}
                                                    </h3>
                                                    <div className="flex items-center text-xs text-[#9CA9B7]">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {formatDate(image.created_at)}
                                                    </div>
                                                </div>

                                                {image.weight_kg && (
                                                    <div className="flex items-center text-sm text-[#9CA9B7]">
                                                        <Weight className="w-4 h-4 mr-1" />
                                                        {image.weight_kg} kg
                                                    </div>
                                                )}

                                                {image.notes && (
                                                    <p className="text-sm text-[#9CA9B7] line-clamp-2">
                                                        {image.notes}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="bg-[#121922] border-[#2A3442] text-[#FBF7FA] hover:bg-[#4AA7FF] hover:border-[#4AA7FF]" />
                            <CarouselNext className="bg-[#121922] border-[#2A3442] text-[#FBF7FA] hover:bg-[#4AA7FF] hover:border-[#4AA7FF]" />
                        </Carousel>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[#FBF7FA] text-xl font-bold">
                            Edit Progress Photo
                        </DialogTitle>
                        <DialogDescription className="text-[#9CA9B7]">
                            Update your progress photo details.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateImage} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#FBF7FA]">Photo Type</Label>
                                <Select
                                    value={editFormData.image_type}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, image_type: value })}
                                >
                                    <SelectTrigger className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121922] border-[#2A3442]">
                                        <SelectItem value="progress" className="text-[#FBF7FA] focus:bg-[#0F101A]">Progress</SelectItem>
                                        <SelectItem value="before" className="text-[#FBF7FA] focus:bg-[#0F101A]">Before</SelectItem>
                                        <SelectItem value="after" className="text-[#FBF7FA] focus:bg-[#0F101A]">After</SelectItem>
                                        <SelectItem value="current" className="text-[#FBF7FA] focus:bg-[#0F101A]">Current</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#FBF7FA]">Visibility</Label>
                                <Select
                                    value={editFormData.visibility}
                                    onValueChange={(value) => setEditFormData({ ...editFormData, visibility: value })}
                                >
                                    <SelectTrigger className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#121922] border-[#2A3442]">
                                        <SelectItem value="private" className="text-[#FBF7FA] focus:bg-[#0F101A]">Private</SelectItem>
                                        <SelectItem value="public" className="text-[#FBF7FA] focus:bg-[#0F101A]">Public</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[#FBF7FA]">Title</Label>
                                <Input
                                    type="text"
                                    value={editFormData.title}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[#FBF7FA]">Weight (kg)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="1000"
                                    value={editFormData.weight_kg}
                                    onChange={(e) => setEditFormData({ ...editFormData, weight_kg: e.target.value })}
                                    className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[#FBF7FA]">Notes</Label>
                            <Textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                                rows={3}
                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl resize-none"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditDialogOpen(false)}
                                className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-[#FBF7FA] text-xl font-bold">
                            Delete Progress Photo
                        </DialogTitle>
                        <DialogDescription className="text-[#9CA9B7]">
                            Are you sure you want to delete this progress photo? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteImage}
                            className="rounded-full bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#121922] transition-all"
                        >
                            Delete Photo
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}