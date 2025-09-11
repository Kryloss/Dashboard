import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resizes an image file to 256x256 pixels while maintaining aspect ratio
 * @param file - The image file to resize
 * @returns Promise<Blob> - The resized image as a Blob
 */
export async function resizeImageTo256x256(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio
      const maxSize = 256
      let { width, height } = img

      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
      }

      // Set canvas size
      canvas.width = maxSize
      canvas.height = maxSize

      // Center the image on the canvas
      const x = (maxSize - width) / 2
      const y = (maxSize - height) / 2

      // Draw the resized image centered on the canvas
      ctx?.drawImage(img, x, y, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        file.type,
        0.9 // Quality for JPEG, ignored for PNG
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Gets the file extension from a MIME type
 * @param mimeType - The MIME type string
 * @returns string - The file extension (without the dot)
 */
/**
 * Resizes and compresses an image for progress photos
 * @param file - The image file to resize
 * @param maxWidth - Maximum width (default: 1200)
 * @param maxHeight - Maximum height (default: 1600) 
 * @param quality - Compression quality 0-1 (default: 0.8)
 * @returns Promise<Blob> - The resized and compressed image as a Blob
 */
export async function resizeProgressImage(
  file: File, 
  maxWidth: number = 1200, 
  maxHeight: number = 1600,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      let { width, height } = img

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const widthRatio = maxWidth / width
        const heightRatio = maxHeight / height
        const ratio = Math.min(widthRatio, heightRatio)
        
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      // Set canvas size to the calculated dimensions
      canvas.width = width
      canvas.height = height

      // Draw the resized image
      ctx?.drawImage(img, 0, 0, width, height)

      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob from canvas'))
          }
        },
        file.type === 'image/png' ? 'image/png' : 'image/jpeg', // Convert all to JPEG except PNG
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    img.src = URL.createObjectURL(file)
  })
}

export function getFileExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff',
  }

  return mimeToExt[mimeType.toLowerCase()] || 'jpg'
}
