import { AuthProvider } from "@/lib/contexts/AuthContext"
import { HealssNav } from "./components/healss-nav"
import "../globals.css"

export default function HealssLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
            <HealssNav />
            {children}
        </AuthProvider>
    )
}