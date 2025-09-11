'use client'

import { useState } from 'react'
import ProgressImageUpload from './progress-image-upload'
import ProgressGallery from './progress-gallery'

export default function ProgressPhotosTab() {
    const [refreshKey, setRefreshKey] = useState(0)

    const handleDataChange = () => {
        // Force refresh of the gallery when new images are uploaded or changed
        setRefreshKey(prev => prev + 1)
    }

    return (
        <div className="space-y-6">
            {/* Upload section */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#FBF7FA] mb-2">
                        Progress Photos
                    </h2>
                    <p className="text-[#9CA9B7]">
                        Track your fitness journey with progress photos over time.
                    </p>
                </div>
                <ProgressImageUpload onUploadSuccess={handleDataChange} />
            </div>

            {/* Gallery */}
            <ProgressGallery key={refreshKey} onDataChange={handleDataChange} />
        </div>
    )
}