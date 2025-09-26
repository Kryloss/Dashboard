"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import { format } from "date-fns"

interface NutritionDeleteConfirmDialogProps {
    date: string
    onCancel: () => void
    onConfirm: () => void
}

export function NutritionDeleteConfirmDialog({ date, onCancel, onConfirm }: NutritionDeleteConfirmDialogProps) {
    return (
        <Dialog open={true} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-[#F3F4F6]">
                                Delete Nutrition Data
                            </DialogTitle>
                            <p className="text-sm text-[#A1A1AA]">
                                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-[#F3F4F6] mb-2">
                        Are you sure you want to delete all nutrition data for this date?
                    </p>
                    <p className="text-sm text-[#A1A1AA]">
                        This will permanently remove all meals, foods, and nutrition information for this day. This action cannot be undone.
                    </p>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t border-[#212227]">
                    <Button
                        onClick={onCancel}
                        variant="secondary"
                        className="bg-[#0E0F13] text-[#F3F4F6] border border-[#212227] rounded-full hover:bg-[#17181D] hover:border-[#2A2B31]"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full"
                    >
                        Delete
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}