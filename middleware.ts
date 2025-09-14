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
                        const cookieOptions = {
                            domain: process.env.NODE_ENV === 'production' ? '.kryloss.com' : undefined,
                            path: '/',
                            sameSite: 'lax' as const,
                            secure: process.env.NODE_ENV === 'production',
                            maxAge: 60 * 60 * 24 * 7, // 7 days
                            ...options
                        }
                        supabaseResponse.cookies.set(name, value, cookieOptions)
                    })
                },
            },
        }
    )

    // Get user authentication status
    const { data: { user } } = await supabase.auth.getUser()
    const isAuthenticated = !!user

    // Check if this is a subdomain we want to handle
    if (subdomain && subdomains[subdomain as keyof typeof subdomains]) {
        const targetRoute = subdomains[subdomain as keyof typeof subdomains]

        // Protected routes for subdomains
        const protectedRoutes = ['/workout', '/progress', '/nutrition', '/dashboard']
        const isProtectedRoute = protectedRoutes.some(route => url.pathname.startsWith(route))

        if (!isAuthenticated && isProtectedRoute) {
            const loginUrl = new URL('/login', request.url)
            return NextResponse.redirect(loginUrl)
        }

        // Handle URL rewriting for subdomains
        if (url.pathname === '/') {
            const newUrl = request.nextUrl.clone()
            newUrl.pathname = targetRoute
            return NextResponse.rewrite(newUrl)
        } else if (url.pathname.startsWith(targetRoute)) {
            return NextResponse.next()
        } else {
            const newPath = `${targetRoute}${url.pathname}`
            const newUrl = request.nextUrl.clone()
            newUrl.pathname = newPath
            return NextResponse.rewrite(newUrl)
        }
    }

    // For main domain, check authentication for protected routes
    const protectedMainRoutes = ['/dashboard', '/profile']
    const isProtectedMainRoute = protectedMainRoutes.some(route => url.pathname.startsWith(route))

    if (!isAuthenticated && isProtectedMainRoute) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('message', 'Please sign in to access this page')
        return NextResponse.redirect(loginUrl)
    }

    return supabaseResponse
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
