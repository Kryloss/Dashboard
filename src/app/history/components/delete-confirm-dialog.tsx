"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { WorkoutActivity } from "@/lib/workout-storage"
import { Trash2 } from "lucide-react"

interface DeleteConfirmDialogProps {
    activity: WorkoutActivity
    onConfirm: () => void
    onCancel: () => void
}

export function DeleteConfirmDialog({ activity, onConfirm, onCancel }: DeleteConfirmDialogProps) {
    return (
        <Dialog open={true} onOpenChange={() => onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <Trash2 className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                            <DialogTitle>Delete Workout</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete &quot;{activity.name || `${activity.workoutType} workout`}&quot;? This action cannot be undone.
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
                        Delete Workout
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}