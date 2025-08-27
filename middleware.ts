import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    try {
        // Handle subdomain routing first
        const hostname = request.headers.get('host') || ''
        const url = request.nextUrl.clone()

        // Check for healss subdomain
        if (hostname.includes('healss.')) {
            // For healss subdomain, rewrite to serve the healss app at root
            if (url.pathname === '/') {
                url.pathname = '/healss'
                return NextResponse.rewrite(url)
            } else {
                // For other paths, serve them from the healss context
                url.pathname = `/healss${url.pathname}`
                return NextResponse.rewrite(url)
            }
        }

        // Continue with Supabase session handling
        return await updateSession(request)
    } catch (error) {
        console.error('Middleware error:', error)
        // Return a basic response to prevent hanging
        return NextResponse.next()
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
