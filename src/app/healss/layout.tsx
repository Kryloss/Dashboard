import { HealssNav } from "./components/healss-nav"

export default function HealssLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <HealssNav />
            {children}
        </>
    )
}
