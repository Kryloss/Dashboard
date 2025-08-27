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
