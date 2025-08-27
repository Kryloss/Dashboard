export interface Update {
    id: string
    title: string
    summary: string
    date: string
    link: string
    category: string
}

export const updates: Update[] = [
    {
        "title": "Gif update",
        "summary": "Upload your gifs as a Avatars for better website experience!",
        "date": "2025-05-27",
        "link": "https://kryloss.com/",
        "category": "Maintenance",
        "id": "9"
    },
    {
        "title": "Healthify 0 - Advanced Health Analytics",
        "summary": "Introducing comprehensive health dashboards with AI-powered insights, custom metric tracking, and seamless wearable integration. Now with support for sleep pattern analysis and nutrition recommendations.",
        "date": "2024-01-15",
        "link": "https://healthify.kryloss.com/updates/v2-0-launch",
        "category": "Product Launch",
        "id": "1"
    },
    {
        "id": "2",
        "title": "Notify - Real-time Notification Engine",
        "summary": "Smart notification management with intelligent priority filtering, customizable delivery channels, and advanced routing rules. Reduce notification fatigue while staying informed.",
        "date": "2024-01-10",
        "link": "https://notify.kryloss.com/features/real-time-engine",
        "category": "Feature Update"
    },
    {
        "id": "3",
        "title": "Enhanced Security & Privacy Controls",
        "summary": "Implementing end-to-end encryption for all personal data, granular privacy settings, and GDPR compliance improvements across all Kryloss platform tools.",
        "date": "2024-01-05",
        "link": "/updates/security-improvements",
        "category": "Security"
    },
    {
        "id": "4",
        "title": "API Gateway & Developer Platform",
        "summary": "Launch of comprehensive developer APIs with authentication, rate limiting, and comprehensive documentation. Build custom integrations with Kryloss platform services.",
        "date": "2023-12-28",
        "link": "/docs/api/getting-started",
        "category": "Developer"
    },
    {
        "id": "5",
        "title": "Mobile App Beta Release",
        "summary": "Cross-platform mobile applications for iOS and Android now available in beta. Access all your tools and dashboards on the go with native performance and offline capabilities.",
        "date": "2023-12-20",
        "link": "/mobile/beta-signup",
        "category": "Mobile"
    },
    {
        "id": "6",
        "title": "Team Collaboration Features",
        "summary": "Share dashboards, set up team notifications, and collaborate on health goals with family and friends. Enhanced permission controls and shared workspace management.",
        "date": "2023-12-15",
        "link": "/features/team-collaboration",
        "category": "Collaboration"
    },
    {
        "id": "7",
        "title": "Data Export & Backup Tools",
        "summary": "Comprehensive data portability with scheduled backups, multiple export formats (JSON, CSV, PDF), and integration with cloud storage providers for peace of mind.",
        "date": "2023-12-10",
        "link": "/tools/data-export",
        "category": "Data"
    },
    {
        "id": "8",
        "title": "Performance Optimization & Speed Improvements",
        "summary": "Significant performance enhancements across all platform tools. 60% faster dashboard loading, improved real-time synchronization, and reduced memory usage.",
        "date": "2023-12-05",
        "link": "/updates/performance-improvements",
        "category": "Performance"
    }
]
