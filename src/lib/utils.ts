import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Resize an image to 256x256 pixels and convert to Blob
 * This helps reduce file size and standardize avatar dimensions
 * GIF files are preserved as GIFs to maintain animation
 */
export async function resizeImageTo256x256(file: File): Promise<Blob> {
    // If it's a GIF, return it as-is to preserve animation
    if (file.type === 'image/gif') {
        return file
    }

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
        }

        const img = new Image()
        img.onload = () => {
            // Set canvas dimensions to 256x256
            canvas.width = 256
            canvas.height = 256

            // Calculate scaling to maintain aspect ratio
            const scale = Math.min(256 / img.width, 256 / img.height)
            const scaledWidth = img.width * scale
            const scaledHeight = img.height * scale

            // Center the image on the canvas
            const x = (256 - scaledWidth) / 2
            const y = (256 - scaledHeight) / 2

            // Fill background with transparent color
            ctx.clearRect(0, 0, 256, 256)

            // Draw the resized image
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight)

            // Convert to blob with quality optimization
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to create blob'))
                    }
                },
                'image/jpeg', // Use JPEG for better compression
                0.85 // 85% quality for good balance of size and quality
            )
        }

        img.onerror = () => {
            reject(new Error('Failed to load image'))
        }

        img.src = URL.createObjectURL(file)
    })
}

/**
 * Get file extension from MIME type
 */
export function getFileExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
    }
    return extensions[mimeType] || 'jpg'
}
