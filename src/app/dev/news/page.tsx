'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectItem } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { UpdateCard } from '@/components/update-card'
import { updates as initialUpdates, Update } from '@/lib/updates'
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DownloadIcon } from 'lucide-react'
// Simple toast replacement
const toast = {
    success: (message: string) => alert(`✅ ${message}`),
    error: (message: string) => alert(`❌ ${message}`)
}

const CATEGORIES = [
    'Product Launch',
    'Feature Update', 
    'Security',
    'Developer',
    'Mobile',
    'Collaboration',
    'Data',
    'Performance',
    'Bug Fix',
    'Maintenance'
]

export default function NewsManager() {
    const [updates, setUpdates] = useState<Update[]>(initialUpdates)
    const [editingUpdate, setEditingUpdate] = useState<Update | null>(null)
    const [isPreviewMode, setIsPreviewMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        date: '',
        link: '',
        category: 'Feature Update'
    })

    // Load updates from server
    useEffect(() => {
        loadUpdates()
    }, [])

    const loadUpdates = async () => {
        try {
            const response = await fetch('/api/dev/news')
            if (response.ok) {
                const data = await response.json()
                setUpdates(data.updates || initialUpdates)
            }
        } catch (error) {
            console.error('Failed to load updates:', error)
            toast.error('Failed to load updates')
        }
    }

    // Save updates to server
    const saveUpdates = async (newUpdates: Update[]) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/dev/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ updates: newUpdates }),
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(data.message || 'Updates saved successfully')
                return true
            } else {
                const errorData = await response.json()
                toast.error(errorData.error || 'Failed to save updates')
                return false
            }
        } catch (error) {
            console.error('Failed to save updates:', error)
            toast.error('Failed to save updates')
            return false
        } finally {
            setIsLoading(false)
        }
    }

    // Generate new ID
    const generateId = () => {
        const maxId = updates.reduce((max, update) => Math.max(max, parseInt(update.id) || 0), 0)
        return (maxId + 1).toString()
    }

    // Reset form
    const resetForm = () => {
        setFormData({
            title: '',
            summary: '',
            date: '',
            link: '',
            category: 'Feature Update'
        })
        setEditingUpdate(null)
    }

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.title || !formData.summary || !formData.date) {
            toast.error('Please fill in all required fields')
            return
        }

        let newUpdates: Update[]

        if (editingUpdate) {
            // Update existing
            newUpdates = updates.map(update => 
                update.id === editingUpdate.id 
                    ? { ...formData, id: editingUpdate.id }
                    : update
            )
        } else {
            // Create new
            const newUpdate: Update = {
                ...formData,
                id: generateId()
            }
            newUpdates = [newUpdate, ...updates]
        }

        // Save to server
        const success = await saveUpdates(newUpdates)
        if (success) {
            setUpdates(newUpdates)
            resetForm()
        }
    }

    // Handle edit
    const handleEdit = (update: Update) => {
        setFormData({
            title: update.title,
            summary: update.summary,
            date: update.date,
            link: update.link,
            category: update.category
        })
        setEditingUpdate(update)
        setIsPreviewMode(false)
    }

    // Handle delete
    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this update?')) {
            const newUpdates = updates.filter(update => update.id !== id)
            const success = await saveUpdates(newUpdates)
            if (success) {
                setUpdates(newUpdates)
            }
        }
    }

    // Export updates to JSON
    const exportUpdates = () => {
        const dataStr = JSON.stringify(updates, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'updates.json'
        link.click()
        URL.revokeObjectURL(url)
        toast.success('Updates exported successfully')
    }

    // Generate TypeScript code
    const generateCode = () => {
        const code = `export interface Update {
    id: string
    title: string
    summary: string
    date: string
    link: string
    category: string
}

export const updates: Update[] = ${JSON.stringify(updates, null, 4)}`

        navigator.clipboard.writeText(code).then(() => {
            toast.success('TypeScript code copied to clipboard')
        }).catch(() => {
            toast.error('Failed to copy to clipboard')
        })
    }

    return (
        <div className="min-h-screen bg-[#0B0C0D] py-8">
            <div className="container mx-auto max-w-7xl px-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-extrabold text-[#FBF7FA] mb-2">
                                News Manager
                            </h1>
                            <p className="text-[#9CA9B7]">
                                Manage updates for the Latest Updates section on the home page
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5"
                            >
                                <EyeIcon className="w-4 h-4 mr-2" />
                                {isPreviewMode ? 'Edit Mode' : 'Preview Mode'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={exportUpdates}
                                className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5"
                            >
                                <DownloadIcon className="w-4 h-4 mr-2" />
                                Export JSON
                            </Button>
                            <Button
                                onClick={generateCode}
                                className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white"
                            >
                                Copy Code
                            </Button>
                        </div>
                    </div>
                </div>

                {isPreviewMode ? (
                    /* Preview Mode */
                    <div className="space-y-8">
                        <div className="text-center">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
                                Latest Updates
                            </h2>
                            <p className="text-xl text-[#9CA9B7] max-w-2xl mx-auto">
                                Stay up to date with new features, improvements, and announcements
                                across the Kryloss platform ecosystem.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {updates.slice(0, 6).map((update) => (
                                <UpdateCard
                                    key={update.id}
                                    title={update.title}
                                    summary={update.summary}
                                    date={update.date}
                                    link={update.link}
                                    category={update.category}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Edit Mode */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                                <div
                                    className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                                    style={{
                                        background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                                    }}
                                />
                                
                                <CardHeader>
                                    <CardTitle className="text-[#FBF7FA]">
                                        {editingUpdate ? 'Edit Update' : 'Create Update'}
                                    </CardTitle>
                                    <CardDescription className="text-[#9CA9B7]">
                                        {editingUpdate ? 'Modify the existing update' : 'Add a new update to the news section'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <Label htmlFor="title" className="text-[#FBF7FA]">Title *</Label>
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                                placeholder="Update title"
                                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8]"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="summary" className="text-[#FBF7FA]">Summary *</Label>
                                            <Textarea
                                                id="summary"
                                                value={formData.summary}
                                                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                                                placeholder="Brief description of the update"
                                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8] min-h-24"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="category" className="text-[#FBF7FA]">Category</Label>
                                            <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                                                {CATEGORIES.map(category => (
                                                    <SelectItem key={category} value={category}>
                                                        {category}
                                                    </SelectItem>
                                                ))}
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="date" className="text-[#FBF7FA]">Date *</Label>
                                            <Input
                                                id="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({...formData, date: e.target.value})}
                                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA]"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="link" className="text-[#FBF7FA]">Link</Label>
                                            <Input
                                                id="link"
                                                type="url"
                                                value={formData.link}
                                                onChange={(e) => setFormData({...formData, link: e.target.value})}
                                                placeholder="https://example.com/update"
                                                className="bg-[#0F101A] border-[#2A3442] text-[#FBF7FA] placeholder-[#90A0A8]"
                                            />
                                        </div>

                                        <div className="flex gap-2 pt-4">
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <PlusIcon className="w-4 h-4 mr-2" />
                                                {isLoading ? 'Saving...' : editingUpdate ? 'Update' : 'Create'}
                                            </Button>
                                            {editingUpdate && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={resetForm}
                                                    className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Updates List */}
                        <div className="lg:col-span-2">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-[#FBF7FA]">
                                        All Updates ({updates.length})
                                    </h3>
                                    <Badge variant="secondary" className="bg-[#2A3442] text-[#9CA9B7]">
                                        Showing top 6 on homepage
                                    </Badge>
                                </div>

                                <div className="space-y-3">
                                    {updates.map((update, index) => (
                                        <Card key={update.id} className="bg-[#121922] border-[#2A3442] rounded-xl">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Badge className="bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-xs">
                                                                {update.category}
                                                            </Badge>
                                                            <span className="text-[#556274] text-xs">
                                                                {new Date(update.date).toLocaleDateString()}
                                                            </span>
                                                            {index < 6 && (
                                                                <Badge variant="outline" className="text-xs border-green-500 text-green-400">
                                                                    On Homepage
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <h4 className="text-[#FBF7FA] font-semibold mb-1">
                                                            {update.title}
                                                        </h4>
                                                        <p className="text-[#9CA9B7] text-sm leading-relaxed">
                                                            {update.summary}
                                                        </p>
                                                        {update.link && (
                                                            <p className="text-[#257ADA] text-xs mt-1 truncate">
                                                                {update.link}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 ml-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(update)}
                                                            className="h-8 w-8 p-0 text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5"
                                                        >
                                                            <PencilIcon className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(update.id)}
                                                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                        >
                                                            <TrashIcon className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}