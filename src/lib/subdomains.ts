export function getSubdomains() {
    // Check if we're in development mode using process.env instead of window
    const isDevelopment = process.env.NODE_ENV === 'development'

    return [
        {
            name: "Healss",
            url: isDevelopment ? "http://healss.localhost:3001" : "https://healss.kryloss.com",
            description: "Health & fitness tracking platform",
            route: "/healss-subdomain"
        },
        {
            name: "Notify",
            url: isDevelopment ? "http://notify.localhost:3000" : "https://notify.kryloss.com",
            description: "Notification management system",
            route: "/notify-subdomain"
        }
    ]
}

// Function to detect current subdomain
export function getCurrentSubdomain(): string | null {
    if (typeof window === 'undefined') return null

    const hostname = window.location.hostname
    const parts = hostname.split('.')

    // Check if we're on a subdomain (more than 2 parts: subdomain.domain.tld)
    if (parts.length > 2) {
        return parts[0]
    }

    return null
}

// Function to get the target route for current subdomain
export function getSubdomainRoute(): string | null {
    const subdomain = getCurrentSubdomain()
    if (!subdomain) return null

    const subdomains = getSubdomains()
    const found = subdomains.find(s => s.name.toLowerCase() === subdomain.toLowerCase())

    return found ? found.route : null
}

// Function to check if current page should use subdomain layout
export function shouldUseSubdomainLayout(): boolean {
    const subdomain = getCurrentSubdomain()
    if (!subdomain) return false

    const subdomains = getSubdomains()
    return subdomains.some(s => s.name.toLowerCase() === subdomain.toLowerCase())
}

// Function to get the current subdomain name for display purposes
export function getCurrentSubdomainName(): string | null {
    const subdomain = getCurrentSubdomain()
    if (!subdomain) return null

    const subdomains = getSubdomains()
    const found = subdomains.find(s => s.name.toLowerCase() === subdomain.toLowerCase())

    return found ? found.name : null
}

// Default export for compatibility
export const subdomains = [
    {
        name: "Healss",
        url: "https://healss.kryloss.com",
        description: "Health & fitness tracking platform",
        route: "/healss-subdomain"
    },
    {
        name: "Notify",
        url: "https://notify.kryloss.com",
        description: "Notification management system",
        route: "/notify-subdomain"
    }
]
