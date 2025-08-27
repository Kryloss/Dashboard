'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function GifTestPage() {
    const [uploadedGifUrl, setUploadedGifUrl] = useState<string>('')

    // Test with a known animated GIF
    const testGifs = [
        'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
        'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif'
    ]

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file && file.type === 'image/gif') {
            const url = URL.createObjectURL(file)
            setUploadedGifUrl(url)
            console.log('GIF file uploaded:', {
                name: file.name,
                type: file.type,
                size: file.size
            })
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                <CardHeader>
                    <CardTitle className="text-[#FBF7FA] text-xl font-bold">
                        GIF Animation Test
                    </CardTitle>
                    <CardDescription className="text-[#9CA9B7]">
                        Test GIF animations in avatars and identify any issues
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Test with known animated GIFs */}
                    <div className="space-y-4">
                        <h3 className="text-[#FBF7FA] font-semibold">Test with Known Animated GIFs:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {testGifs.map((gifUrl, index) => (
                                <div key={index} className="text-center space-y-2">
                                    <Avatar className="w-20 h-20 mx-auto">
                                        <AvatarImage
                                            src={gifUrl}
                                            alt={`Test GIF ${index + 1}`}
                                            onLoad={(e) => {
                                                const img = e.target as HTMLImageElement
                                                console.log(`Test GIF ${index + 1} loaded:`, {
                                                    src: img.src,
                                                    naturalWidth: img.naturalWidth,
                                                    naturalHeight: img.naturalHeight,
                                                    complete: img.complete
                                                })
                                            }}
                                            onError={(e) => {
                                                console.error(`Test GIF ${index + 1} failed to load:`, e)
                                            }}
                                        />
                                        <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA]">
                                            GIF {index + 1}
                                        </AvatarFallback>
                                    </Avatar>
                                    <p className="text-xs text-[#9CA9B7]">Test GIF {index + 1}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Test with uploaded GIF */}
                    <div className="space-y-4">
                        <h3 className="text-[#FBF7FA] font-semibold">Test with Uploaded GIF:</h3>
                        <div className="flex items-center space-x-4">
                            <input
                                type="file"
                                accept="image/gif"
                                onChange={handleFileUpload}
                                className="text-[#9CA9B7]"
                            />
                            <Button
                                variant="outline"
                                onClick={() => setUploadedGifUrl('')}
                                className="border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5"
                            >
                                Clear
                            </Button>
                        </div>

                        {uploadedGifUrl && (
                            <div className="text-center space-y-2">
                                <Avatar className="w-20 h-20 mx-auto">
                                    <AvatarImage
                                        src={uploadedGifUrl}
                                        alt="Uploaded GIF"
                                        onLoad={(e) => {
                                            const img = e.target as HTMLImageElement
                                            console.log('Uploaded GIF loaded:', {
                                                src: img.src,
                                                naturalWidth: img.naturalWidth,
                                                naturalHeight: img.naturalHeight,
                                                complete: img.complete
                                            })
                                        }}
                                        onError={(e) => {
                                            console.error('Uploaded GIF failed to load:', e)
                                        }}
                                    />
                                    <AvatarFallback className="bg-[#0F101A] text-[#FBF7FA]">
                                        GIF
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-xs text-[#9CA9B7]">Uploaded GIF</p>
                            </div>
                        )}
                    </div>

                    {/* Debug information */}
                    <div className="space-y-4">
                        <h3 className="text-[#FBF7FA] font-semibold">Debug Information:</h3>
                        <div className="bg-[#0F101A] p-4 rounded-lg border border-[#2A3442]">
                            <p className="text-sm text-[#9CA9B7]">
                                <strong>Browser:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Server-side'}
                            </p>
                            <p className="text-sm text-[#9CA9B7]">
                                <strong>Canvas Support:</strong> {typeof window !== 'undefined' ? (document.createElement('canvas').getContext('2d') ? 'Yes' : 'No') : 'Unknown'}
                            </p>
                            <p className="text-sm text-[#9CA9B7]">
                                <strong>File API Support:</strong> {typeof window !== 'undefined' ? (window.File && window.FileReader ? 'Yes' : 'No') : 'Unknown'}
                            </p>
                            <p className="text-sm text-[#9CA9B7]">
                                <strong>Check Console:</strong> Open browser console to see detailed loading logs
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

