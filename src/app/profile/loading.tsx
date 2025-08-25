import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-[#0B0C0D] pt-6">
            <div className="container mx-auto max-w-4xl px-6">
                {/* Header Skeleton */}
                <div className="mb-8">
                    <div className="h-12 bg-[#121922] rounded-lg mb-4 animate-pulse"></div>
                    <div className="h-6 bg-[#121922] rounded-lg max-w-lg animate-pulse"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Picture Card Skeleton */}
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />
                        <CardHeader className="text-center">
                            <div className="h-6 bg-[#0F101A] rounded animate-pulse mx-auto w-32"></div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <div className="w-24 h-24 bg-[#0F101A] rounded-full animate-pulse"></div>
                            <div className="h-8 w-40 bg-[#0F101A] rounded-full animate-pulse"></div>
                        </CardContent>
                    </Card>

                    {/* Profile Information Card Skeleton */}
                    <div className="lg:col-span-2">
                        <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                            <div
                                className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                                style={{
                                    background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                                }}
                            />
                            <CardHeader>
                                <div className="h-6 bg-[#0F101A] rounded animate-pulse w-48"></div>
                                <div className="h-4 bg-[#0F101A] rounded animate-pulse w-64 mt-2"></div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-[#0F101A] rounded animate-pulse w-16"></div>
                                        <div className="h-10 bg-[#0F101A] rounded-xl animate-pulse"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-[#0F101A] rounded animate-pulse w-20"></div>
                                        <div className="h-10 bg-[#0F101A] rounded-xl animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="h-4 bg-[#0F101A] rounded animate-pulse w-24"></div>
                                        <div className="h-10 bg-[#0F101A] rounded-xl animate-pulse"></div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-[#0F101A] rounded animate-pulse w-20"></div>
                                        <div className="h-10 bg-[#0F101A] rounded-xl animate-pulse"></div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <div className="h-10 w-32 bg-[#0F101A] rounded-full animate-pulse"></div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
