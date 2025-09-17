"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SleepData } from "@/lib/user-data-storage"
import { Trash2 } from "lucide-react"

interface SleepDeleteConfirmDialogProps {
    sleepData: SleepData
    onConfirm: () => void
    onCancel: () => void
}

export function SleepDeleteConfirmDialog({ sleepData, onConfirm, onCancel }: SleepDeleteConfirmDialogProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    return (
        <Dialog open={true} onOpenChange={() => onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle>Delete Sleep Session</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the sleep session from {formatDate(sleepData.date)} ({formatDuration(sleepData.totalMinutes)})? This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex justify-end space-x-2">
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        variant="destructive"
                        className="bg-gradient-to-r from-red-600 to-red-500 text-white rounded-full hover:from-red-500 hover:to-red-400"
                    >
                        Delete Sleep Session
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}