import Link from "next/link"
import { Separator } from "@/components/ui/separator"

export function Footer() {
    return (
        <footer className="bg-[#121922] border-t border-[#2A3442] mt-8">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="inline-block mb-4">
                            <h3 className="text-xl font-bold text-[#FBF7FA] bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] bg-clip-text text-transparent">
                                Kryloss
                            </h3>
                        </Link>
                        <p className="text-[#9CA9B7] text-sm leading-relaxed max-w-md">
                            Your centralized productivity hub. Access powerful tools for health tracking,
                            notifications, and workflow management from one unified dashboard.
                        </p>
                    </div>

                    {/* Platform Links */}
                    <div>
                        <h4 className="text-[#FBF7FA] font-semibold text-sm mb-4">Platform</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="https://healthify.kryloss.com"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Healthify
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://notify.kryloss.com"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Notify
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dashboard"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Dashboard
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h4 className="text-[#FBF7FA] font-semibold text-sm mb-4">Legal</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="mailto:support@kryloss.com"
                                    className="text-[#9CA9B7] text-sm hover:text-[#4AA7FF] transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] rounded"
                                >
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <Separator className="my-6 bg-[#2A3442]" />

                {/* Bottom Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <p className="text-[#556274] text-sm">
                        © {new Date().getFullYear()} Kryloss. All rights reserved.
                    </p>
                    <p className="text-[#556274] text-sm">
                        Built with Next.js, Tailwind CSS, and shadcn/ui
                    </p>
                </div>
            </div>
        </footer>
    )
}
