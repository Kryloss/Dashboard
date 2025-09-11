'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { uploadProgressImage } from '@/lib/actions/progress-images'
import { resizeProgressImage, getFileExtension } from '@/lib/utils'
import { Plus, Upload, Camera } from 'lucide-react'

interface ProgressImageUploadProps {
    onUploadSuccess?: () => void
}

export default function ProgressImageUpload({ onUploadSuccess }: ProgressImageUploadProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        notes: '',
        weight_kg: '',
        image_type: 'progress',
        visibility: 'private'
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            try {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    setError('Please select an image file')
                    return
                }

                // Validate file size (10MB limit before compression)
                if (file.size > 10 * 1024 * 1024) {
                    setError('Image size must be less than 10MB. Please choose a smaller image.')
                    return
                }

                setError(null)

                // Resize and compress image for progress photos
                const compressedBlob = await resizeProgressImage(file, 1200, 1600, 0.8)

                // Create a new file with the compressed blob
                const compressedFile = new File(
                    [compressedBlob],
                    `progress.${getFileExtension(file.type)}`,
                    { type: compressedBlob.type }
                )

                setSelectedFile(compressedFile)

                // Create preview URL
                const url = URL.createObjectURL(compressedBlob)
                setPreviewUrl(url)
            } catch (error) {
                console.error('Image processing error:', error)
                setError('Failed to process image. Please try again.')
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFile) {
            setError('Please select an image')
            return
        }

        setIsUploading(true)
        setError(null)

        try {
            const uploadFormData = new FormData()
            uploadFormData.append('image', selectedFile)
            uploadFormData.append('title', formData.title)
            uploadFormData.append('notes', formData.notes)
            uploadFormData.append('weight_kg', formData.weight_kg)
            uploadFormData.append('image_type', formData.image_type)
            uploadFormData.append('visibility', formData.visibility)

            const result = await uploadProgressImage(uploadFormData)

            if (result?.error) {
                setError(result.error)
            } else {
                // Reset form and close dialog
                setFormData({
                    title: '',
                    notes: '',
                    weight_kg: '',
                    image_type: 'progress',
                    visibility: 'private'
                })
                setSelectedFile(null)
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                }
                setPreviewUrl(null)
                setIsOpen(false)
                onUploadSuccess?.()
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError('Failed to upload image. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    const resetForm = () => {
        setFormData({
            title: '',
            notes: '',
            weight_kg: '',
            image_type: 'progress',
            visibility: 'private'
        })
        setSelectedFile(null)
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
        setError(null)
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) {
            resetForm()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Progress Photo
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl max-w-lg">
                <div
                    className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                    style={{
                        background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                    }}
                />

                <DialogHeader>
                    <DialogTitle className="text-[#FBF7FA] text-xl font-bold">
                        Add Progress Photo
                    </DialogTitle>
                    <DialogDescription className="text-[#9CA9B7]">
                        Upload a new progress photo to track your fitness journey.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Error message */}
                    {error && (
                        <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* File upload area */}
                    <div className="space-y-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {!selectedFile ? (
                            <div
                                onClick={triggerFileInput}
                                className="border-2 border-dashed border-[#2A3442] rounded-xl p-8 text-center cursor-pointer hover:border-[#4AA7FF] hover:bg-[#0F101A] transition-all"
                            >
                                <Camera className="w-12 h-12 mx-auto mb-4 text-[#556274]" />
                                <p className="text-[#FBF7FA] font-medium mb-2">Click to upload photo</p>
                                <p className="text-[#556274] text-sm">Auto-optimized for web • Max 10MB original</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Image
                                        src={previewUrl || ''}
                                        alt="Preview"
                                        width={400}
                                        height={192}
                                        className="w-full h-48 object-cover rounded-xl"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFile(null)
                                            if (previewUrl) {
                                                URL.revokeObjectURL(previewUrl)
                                            }
                                            setPreviewUrl(null)
                                        }}
                                        className="absolute top-2 right-2 bg-[#121922] border-[#2A3442] text-[#FBF7FA] hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/30"
                                    >
                                        Remove
                                    </Button>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={triggerFileInput}
                                    className="w-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] rounded-xl"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose Different Photo
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Metadata fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="image_type" className="text-[#FBF7FA]">
                                Photo Type
                            </Label>
                            <Select
                                value={formData.image_type}
                                onValueChange={(value) => setFormData({ ...formData, image_type: value })}
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
                            <Label htmlFor="visibility" className="text-[#FBF7FA]">
                                Visibility
                            </Label>
                            <Select
                                value={formData.visibility}
                                onValueChange={(value) => setFormData({ ...formData, visibility: value })}
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
                            <Label htmlFor="title" className="text-[#FBF7FA]">
                                Title (Optional)
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., 3 Month Progress"
                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="weight_kg" className="text-[#FBF7FA]">
                                Weight (kg) (Optional)
                            </Label>
                            <Input
                                id="weight_kg"
                                type="number"
                                step="0.1"
                                min="0"
                                max="1000"
                                value={formData.weight_kg}
                                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                                placeholder="e.g., 75.5"
                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes" className="text-[#FBF7FA]">
                            Notes (Optional)
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Add any notes about your progress..."
                            rows={3}
                            className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] focus:border-[#4AA7FF] focus:ring-[#93C5FD] rounded-xl resize-none"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isUploading}
                            className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUploading || !selectedFile}
                            className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none px-6"
                        >
                            {isUploading ? 'Uploading...' : 'Upload Photo'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}