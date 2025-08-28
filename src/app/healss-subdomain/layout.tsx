import { AuthProvider } from "@/lib/contexts/AuthContext"
import { HealssNav } from "./components/healss-nav"

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
