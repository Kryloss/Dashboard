import { NextRequest, NextResponse } from 'next/server'

// Define your subdomains and their corresponding routes
const subdomains = {
    'healss': '/healss-subdomain',
    'notify': '/notify-subdomain',
    // Add more subdomains as needed
}

export function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Extract subdomain from hostname
    const subdomain = hostname.split('.')[0]

    // Check if this is a subdomain we want to handle
    if (subdomain && subdomains[subdomain as keyof typeof subdomains]) {
        const targetRoute = subdomains[subdomain as keyof typeof subdomains]

        // If user is on root of subdomain, redirect to the specific route
        if (url.pathname === '/') {
            const redirectUrl = new URL(targetRoute, request.url)
            console.log(`Redirecting ${hostname}${url.pathname} to ${redirectUrl.pathname}`)
            return NextResponse.redirect(redirectUrl)
        }

        // If user is already on the correct route, allow it
        if (url.pathname.startsWith(targetRoute)) {
            return NextResponse.next()
        }

        // For any other path on the subdomain, redirect to the subdomain route
        const redirectUrl = new URL(targetRoute, request.url)
        console.log(`Redirecting ${hostname}${url.pathname} to ${redirectUrl.pathname}`)
        return NextResponse.redirect(redirectUrl)
    }

    // For main domain or unknown subdomains, continue normally
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
