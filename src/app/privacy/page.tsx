import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export const metadata: Metadata = {
    title: 'Privacy Policy | Kryloss',
    description: 'Learn how Kryloss collects, uses, and protects your personal data across our productivity platform and services.',
    openGraph: {
        title: 'Privacy Policy | Kryloss',
        description: 'Learn how Kryloss collects, uses, and protects your personal data across our productivity platform and services.',
        url: 'https://kryloss.com/privacy',
        siteName: 'Kryloss',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Privacy Policy | Kryloss',
        description: 'Learn how Kryloss collects, uses, and protects your personal data across our productivity platform and services.',
    },
    alternates: {
        canonical: 'https://kryloss.com/privacy',
    },
}

const lastUpdated = '2024-01-15T00:00:00Z'

const tableOfContents = [
    { id: 'introduction', title: 'Introduction & Scope' },
    { id: 'data-collection', title: 'Data We Collect' },
    { id: 'data-usage', title: 'How We Use Your Data' },
    { id: 'legal-basis', title: 'Legal Basis for Processing' },
    { id: 'data-sharing', title: 'Data Sharing & Third Parties' },
    { id: 'retention-security', title: 'Data Retention & Security' },
    { id: 'user-rights', title: 'Your Rights' },
    { id: 'cookies', title: 'Cookies & Analytics' },
    { id: 'children', title: 'Children&apos;s Privacy' },
    { id: 'contact', title: 'Contact Information' },
    { id: 'updates', title: 'Changes to This Policy' },
]

function TableOfContents() {
    return (
        <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
            <div
                className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                style={{
                    background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                }}
            />
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-[#FBF7FA]">
                    Table of Contents
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-80">
                    <nav className="space-y-2">
                        {tableOfContents.map((item, index) => (
                            <div key={item.id}>
                                <Link
                                    href={`#${item.id}`}
                                    className="block text-sm text-[#9CA9B7] hover:text-[#4AA7FF] transition-colors py-1.5 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922]"
                                >
                                    {item.title}
                                </Link>
                                {index < tableOfContents.length - 1 && (
                                    <Separator className="my-1 bg-[#2A3442]" />
                                )}
                            </div>
                        ))}
                    </nav>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-[#000000]">
            {/* Background gradient orb effect */}
            <div
                className="absolute inset-0 opacity-40"
                style={{
                    background: "radial-gradient(circle at 50% 30%, rgba(74,167,255,0.35) 0%, rgba(17,78,178,0.20) 45%, rgba(15,9,45,0.0) 80%)"
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-[#FBF7FA] mb-4 bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] bg-clip-text text-transparent">
                        Privacy Policy
                    </h1>
                    <p className="text-lg text-[#9CA9B7] mb-6 max-w-3xl mx-auto">
                        We take your privacy seriously. This policy explains how Kryloss collects, uses, and protects your personal information across our productivity platform.
                    </p>
                    <p className="text-sm text-[#556274]">
                        Last updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Table of Contents - Sticky on desktop */}
                    <div className="lg:col-span-1">
                        <div className="lg:sticky lg:top-8">
                            <TableOfContents />
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                            <div
                                className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                                style={{
                                    background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)"
                                }}
                            />
                            <CardContent className="p-8">
                                <div className="prose prose-invert max-w-none">

                                    {/* Introduction & Scope */}
                                    <section id="introduction" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Introduction & Scope</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            This Privacy Policy applies to the Kryloss platform (kryloss.com) and all associated subdomains and services, including but not limited to Healss (healss.kryloss.com) and Notify (notify.kryloss.com). Kryloss operates as a centralized productivity dashboard providing access to various tools and services.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            By using our services, you agree to the collection and use of information in accordance with this policy. This policy governs your use of the Service and explains how we collect, safeguard and disclose information that results from your use of our Service.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Data Collection */}
                                    <section id="data-collection" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Data We Collect</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Account Information</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Email address (required for account creation)</li>
                                            <li>Full name (optional, for profile customization)</li>
                                            <li>Profile picture/avatar URL (optional)</li>
                                            <li>Account preferences and settings</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Authentication Data</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Securely hashed passwords (via Supabase Auth)</li>
                                            <li>Authentication tokens and session data</li>
                                            <li>Google OAuth data (if you choose to sign in with Google)</li>
                                            <li>Password reset tokens (temporary)</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Usage Data</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Pages visited and features used</li>
                                            <li>Time spent on different sections</li>
                                            <li>Device information (browser, OS, screen size)</li>
                                            <li>IP address and general location data</li>
                                        </ul>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Data Usage */}
                                    <section id="data-usage" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">How We Use Your Data</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Core Service Operations</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>User authentication and account management</li>
                                            <li>Providing access to Kryloss tools and features</li>
                                            <li>Personalizing your dashboard experience</li>
                                            <li>Syncing data across devices and sessions</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Communications</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Welcome emails for new accounts (via Resend)</li>
                                            <li>Password reset and security notifications</li>
                                            <li>Important service updates and maintenance notices</li>
                                            <li>Customer support responses</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Security & Fraud Prevention</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Detecting and preventing unauthorized access</li>
                                            <li>Monitoring for suspicious activity</li>
                                            <li>Implementing rate limiting and abuse prevention</li>
                                            <li>Maintaining system security and integrity</li>
                                        </ul>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Legal Basis */}
                                    <section id="legal-basis" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Legal Basis for Processing</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We process your personal data based on the following legal grounds:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li><strong className="text-[#FBF7FA]">Consent:</strong> When you voluntarily provide information or agree to specific data uses</li>
                                            <li><strong className="text-[#FBF7FA]">Contract:</strong> To provide the services you&apos;ve requested and maintain your account</li>
                                            <li><strong className="text-[#FBF7FA]">Legitimate Interest:</strong> For security, fraud prevention, and service improvement</li>
                                            <li><strong className="text-[#FBF7FA]">Legal Obligation:</strong> When required by applicable laws and regulations</li>
                                        </ul>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Data Sharing */}
                                    <section id="data-sharing" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Data Sharing & Third Parties</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Service Providers</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We work with trusted third-party service providers who help us operate our platform:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li><strong className="text-[#FBF7FA]">Supabase:</strong> Database and authentication services</li>
                                            <li><strong className="text-[#FBF7FA]">Resend:</strong> Transactional email delivery</li>
                                            <li><strong className="text-[#FBF7FA]">Vercel:</strong> Hosting and deployment infrastructure</li>
                                            <li><strong className="text-[#FBF7FA]">Google:</strong> OAuth authentication (if you choose this option)</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Data Sale Policy</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            <strong className="text-[#4AA7FF]">We do not sell, rent, or trade your personal data to third parties for their marketing purposes.</strong> Any data sharing is limited to the service providers necessary to operate our platform and provide you with our services.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Retention & Security */}
                                    <section id="retention-security" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Data Retention & Security</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Retention Periods</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Account data: Retained while your account is active</li>
                                            <li>Authentication logs: 90 days for security purposes</li>
                                            <li>Support communications: 2 years for quality assurance</li>
                                            <li>Deleted accounts: 30-day grace period, then permanent deletion</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Security Measures</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>All passwords are cryptographically hashed and salted</li>
                                            <li>Database access protected by Row Level Security (RLS)</li>
                                            <li>Principle of least privilege for all system access</li>
                                            <li>HTTPS encryption for all data transmission</li>
                                            <li>Regular security audits and updates</li>
                                        </ul>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* User Rights */}
                                    <section id="user-rights" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Your Rights</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            You have the following rights regarding your personal data:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li><strong className="text-[#FBF7FA]">Access:</strong> Request a copy of the personal data we hold about you</li>
                                            <li><strong className="text-[#FBF7FA]">Rectification:</strong> Correct any inaccurate or incomplete data</li>
                                            <li><strong className="text-[#FBF7FA]">Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                                            <li><strong className="text-[#FBF7FA]">Portability:</strong> Export your data in a commonly used format</li>
                                            <li><strong className="text-[#FBF7FA]">Restriction:</strong> Limit how we process your data in certain circumstances</li>
                                            <li><strong className="text-[#FBF7FA]">Objection:</strong> Object to processing based on legitimate interests</li>
                                        </ul>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            To exercise these rights, please contact us at{" "}
                                            <Link href="mailto:privacy@kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                privacy@kryloss.com
                                            </Link>.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Cookies */}
                                    <section id="cookies" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Cookies & Analytics</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We use essential cookies to maintain your session and provide core functionality. These cookies are necessary for the service to work properly and cannot be disabled.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            <em className="text-[#556274]">
                                                Note: We currently do not use third-party analytics or tracking cookies. If we implement analytics in the future, we will update this policy and provide appropriate opt-out mechanisms.
                                            </em>
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Children */}
                                    <section id="children" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Children&apos;s Privacy</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us immediately.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            If we discover that a child under 13 has created an account, we will take steps to delete that account and any associated personal information as quickly as possible.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Contact */}
                                    <section id="contact" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Contact Information</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            If you have any questions about this Privacy Policy or our data practices, please contact us:
                                        </p>
                                        <div className="bg-[#0F101A] border border-[#2A3442] rounded-xl p-4">
                                            <p className="text-[#FBF7FA] font-medium mb-2">Privacy Officer</p>
                                            <p className="text-[#9CA9B7]">
                                                Email:{" "}
                                                <Link href="mailto:privacy@kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                    privacy@kryloss.com
                                                </Link>
                                            </p>
                                            <p className="text-[#9CA9B7]">
                                                Website:{" "}
                                                <Link href="https://kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                    kryloss.com
                                                </Link>
                                            </p>
                                        </div>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Updates */}
                                    <section id="updates" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Changes to This Policy</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make significant changes, we will:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Update the &quot;Last updated&quot; date at the top of this policy</li>
                                            <li>Notify you via email if you have an account with us</li>
                                            <li>Display a prominent notice on our website</li>
                                            <li>For material changes, provide advance notice when possible</li>
                                        </ul>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            Your continued use of our services after any changes indicates your acceptance of the updated policy.
                                        </p>
                                    </section>

                                </div>
                            </CardContent>
                        </Card>

                        {/* Back to Home Button */}
                        <div className="text-center mt-8">
                            <Button
                                asChild
                                variant="outline"
                                className="rounded-full bg-white text-[#0B0C0D] border-0 shadow-[0_8px_20px_rgba(0,0,0,0.25)] hover:bg-[#F2F4F7] hover:shadow-[0_10px_26px_rgba(0,0,0,0.30)] active:bg-[#E6E9EF] transition-all"
                            >
                                <Link href="/">
                                    ← Back to Home
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
