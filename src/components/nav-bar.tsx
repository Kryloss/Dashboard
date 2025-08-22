"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { subdomains } from "@/lib/subdomains"
import { cn } from "@/lib/utils"

export function NavBar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#1C2430] bg-[#0B0C0D]/80 backdrop-blur">
            <div className="container flex h-16 items-center justify-between px-6">
                {/* Logo */}
                <Link
                    href="https://kryloss.com"
                    className="flex items-center space-x-2 font-bold text-xl text-[#FBF7FA] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] rounded-md px-2 py-1"
                >
                    <span>Kryloss</span>
                </Link>

                {/* Center Navigation */}
                <div className="flex items-center">
                    <NavigationMenu>
                        <NavigationMenuList>
                            <NavigationMenuItem>
                                <NavigationMenuTrigger className="bg-transparent text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5 data-[state=open]:bg-white/5 data-[state=open]:text-[#FBF7FA]">
                                    Tools
                                </NavigationMenuTrigger>
                                <NavigationMenuContent>
                                    <ul className="grid w-[300px] gap-3 p-4 bg-[#121922] border border-[#2A3442]">
                                        {subdomains.map((subdomain) => (
                                            <ListItem
                                                key={subdomain.name}
                                                title={subdomain.name}
                                                href={subdomain.url}
                                            >
                                                {subdomain.description}
                                            </ListItem>
                                        ))}
                                    </ul>
                                </NavigationMenuContent>
                            </NavigationMenuItem>

                            <NavigationMenuItem>
                                <NavigationMenuLink asChild>
                                    <Link
                                        href="/docs"
                                        className={cn(
                                            navigationMenuTriggerStyle(),
                                            "bg-transparent text-[#9CA9B7] hover:text-[#FBF7FA] hover:bg-white/5"
                                        )}
                                    >
                                        Documentation
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        </NavigationMenuList>
                    </NavigationMenu>
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        asChild
                        className="rounded-full border-[#2A3442] text-[#FBF7FA] hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-[#93C5FD]"
                    >
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button
                        asChild
                        className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] active:brightness-95 transition-all"
                    >
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </div>
            </div>
        </header>
    )
}

function ListItem({
    title,
    children,
    href,
    ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
    return (
        <li {...props}>
            <NavigationMenuLink asChild>
                <Link
                    href={href}
                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-[#0F101A] hover:text-[#FBF7FA] focus:bg-[#0F101A] focus:text-[#FBF7FA] text-[#9CA9B7]"
                >
                    <div className="text-sm font-medium leading-none text-[#FBF7FA]">{title}</div>
                    <p className="line-clamp-2 text-sm leading-snug text-[#9CA9B7]">
                        {children}
                    </p>
                </Link>
            </NavigationMenuLink>
        </li>
    )
}
