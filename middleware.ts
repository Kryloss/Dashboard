import { NextRequest, NextResponse } from 'next/server'

// Define your subdomains and their corresponding routes
const subdomains = {
    'healss': '/healss',
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

        // Instead of redirecting, rewrite the URL to serve content from the target route
        // This keeps the user on healss.kryloss.com while serving /healss-subdomain content
        const newUrl = request.nextUrl.clone()

        if (url.pathname === '/') {
            // Root path: rewrite to serve the subdomain route content
            newUrl.pathname = targetRoute
            console.log(`Rewriting ${hostname}${url.pathname} to serve ${targetRoute} content`)
            return NextResponse.rewrite(newUrl)
        } else if (url.pathname.startsWith(targetRoute)) {
            // Already on the correct route, continue normally
            return NextResponse.next()
        } else {
            // Any other path: rewrite to serve from subdomain route
            const newPath = `${targetRoute}${url.pathname}`
            newUrl.pathname = newPath
            console.log(`Rewriting ${hostname}${url.pathname} to serve ${newPath} content`)
            return NextResponse.rewrite(newUrl)
        }
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
