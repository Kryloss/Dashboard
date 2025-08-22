import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import Link from "next/link"

interface UpdateCardProps {
    title: string
    summary: string
    date: string
    link: string
    category?: string
}

export function UpdateCard({ title, summary, date, link, category = "Update" }: UpdateCardProps) {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    return (
        <Card className="group bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] hover:bg-[#0F101A] hover:shadow-[0_14px_40px_rgba(0,0,0,0.55)] hover:-translate-y-0.5 transition-all duration-300 focus-within:ring-2 focus-within:ring-[#93C5FD] focus-within:ring-offset-2 focus-within:ring-offset-[#0B0C0D] rounded-2xl">
            {/* Accent edge glow */}
            <div
                className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                style={{
                    background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                }}
            />

            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-xs font-medium">
                                {category}
                            </div>
                            <span className="text-[#556274] text-xs">{formattedDate}</span>
                        </div>
                        <CardTitle className="text-[#FBF7FA] text-xl font-bold leading-tight group-hover:text-white transition-colors">
                            {title}
                        </CardTitle>
                    </div>
                    <CardAction>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5 rounded-full"
                        >
                            <Link href={link}>View</Link>
                        </Button>
                    </CardAction>
                </div>
            </CardHeader>

            <CardContent>
                <CardDescription className="text-[#9CA9B7] leading-relaxed">
                    {summary}
                </CardDescription>
            </CardContent>

            <CardFooter>
                <Button
                    variant="link"
                    asChild
                    className="p-0 h-auto text-[#257ADA] hover:text-[#4AA7FF] underline-offset-4 font-medium"
                >
                    <Link href={link}>Read more →</Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
