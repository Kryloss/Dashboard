import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Define your subdomains and their corresponding routes
const subdomains = {
    'healss': '/healss',
    'notify': '/notify-subdomain',
    // Add more subdomains as needed
}

export async function middleware(request: NextRequest) {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // Extract subdomain from hostname
    const subdomain = hostname.split('.')[0]

    // Create Supabase client for auth checks
    const supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        // Configure cookies for cross-subdomain authentication
                        const enhancedOptions = {
                            ...options,
                            domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined, // Allow cookies to be shared across all subdomains in production
                            path: '/',
                            sameSite: 'lax' as const,
                            secure: process.env.NODE_ENV === 'production',
                            ...options
                        }
                        supabaseResponse.cookies.set(name, value, enhancedOptions)
                    })
                },
            },
        }
    )

    // Check if this is a subdomain we want to handle
    if (subdomain && subdomains[subdomain as keyof typeof subdomains]) {
        const targetRoute = subdomains[subdomain as keyof typeof subdomains]

        // Check authentication status
        const { data: { session } } = await supabase.auth.getSession()

        // If user is not authenticated and trying to access protected routes
        const protectedRoutes = ['/workout', '/progress', '/nutrition', '/dashboard']
        const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))

        if (!session && isProtectedRoute) {
            // Redirect to login page on the same subdomain
            const loginUrl = new URL('/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        // Handle URL rewriting for subdomains
        if (url.pathname === '/') {
            // Root path: rewrite to serve the subdomain route content
            const newUrl = request.nextUrl.clone()
            newUrl.pathname = targetRoute
            console.log(`Rewriting ${hostname}${url.pathname} to serve ${targetRoute} content`)
            return NextResponse.rewrite(newUrl)
        } else if (url.pathname.startsWith(targetRoute)) {
            // Already on the correct route, continue normally
            return NextResponse.next()
        } else {
            // Any other path: rewrite to serve from subdomain route
            const newPath = `${targetRoute}${url.pathname}`
            const newUrl = request.nextUrl.clone()
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
