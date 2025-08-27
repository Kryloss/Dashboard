import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
    return (
        <section
            className="relative min-h-[600px] flex items-center justify-center bg-black overflow-hidden"
            data-kind="hero"
        >
            {/* Hero Gradient Orb Background */}
            <div
                className="absolute inset-0 opacity-80"
                style={{
                    background: "radial-gradient(circle at 50% 65%, rgba(74,167,255,0.65) 0%, rgba(17,78,178,0.30) 45%, rgba(15,9,45,0.0) 80%)"
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
                {/* Logo/Brand */}
                <div className="mb-6">
                    <h1 className="text-7xl md:text-7xl font-extrabold text-[#FBF7FA] tracking-tight leading-[70px] mb-5">
                        Kryloss
                    </h1>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(37,122,218,0.10)] border border-[rgba(37,122,218,0.35)] text-[#4AA7FF] text-sm font-medium">
                        <div className="w-2 h-2 bg-[#4AA7FF] rounded-full animate-pulse"></div>
                        Platform Status: Active
                    </div>
                </div>

                {/* Description */}
                <p className="text-xl md:text-2xl text-[#9CA9B7] mb-8 max-w-2xl mx-auto leading-relaxed">
                    Your centralized hub for powerful productivity tools. Access health tracking,
                    notifications, and more from one unified dashboard.
                </p>

                {/* Featured Image Placeholder */}
                <div className="mb-4">
                    <div className="relative w-full max-w-2xl mx-auto h-[300px] rounded-2xl bg-[#121922] border border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-[#0F101A] rounded-xl border border-[#1C2430] flex items-center justify-center">
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#114EB2] to-[#4AA7FF] rounded-lg"></div>
                                </div>
                                <p className="text-[#9CA9B7] text-sm">Dashboard Preview</p>
                            </div>
                        </div>
                        {/* Accent edge glow */}
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px]"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                            }}
                        />
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    <Button
                        size="lg"
                        asChild
                        className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-black active:brightness-95 transition-all px-8 py-3"
                    >
                        <Link href="/signup">Get Started</Link>
                    </Button>
                    <Button
                        variant="secondary"
                        size="lg"
                        asChild
                        className="rounded-full bg-white text-[#0B0C0D] shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:bg-[#F2F4F7] hover:shadow-[0_10px_26px_rgba(0,0,0,0.30)] active:bg-[#E6E9EF] transition-all px-8 py-3"
                    >
                        <Link href="https://healthify.kryloss.com">Explore Tools</Link>
                    </Button>
                </div>
            </div>

            {/* Soft glow shadow effect */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    boxShadow: "0 0 36px rgba(74,167,255,0.30)"
                }}
            />
        </section>
    )
}
