import { AuthProvider } from "@/lib/contexts/AuthContext"
import { HealssNav } from "./components/healss-nav"
import "../globals.css"

export default function HealssLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-[#0B0C0D] text-[#FBF7FA] antialiased">
                <AuthProvider>
                    <HealssNav />
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
