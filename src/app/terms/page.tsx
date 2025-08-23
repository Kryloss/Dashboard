import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export const metadata: Metadata = {
    title: 'Terms of Service | Kryloss',
    description: 'Read the terms and conditions for using Kryloss productivity platform and associated services.',
    openGraph: {
        title: 'Terms of Service | Kryloss',
        description: 'Read the terms and conditions for using Kryloss productivity platform and associated services.',
        url: 'https://kryloss.com/terms',
        siteName: 'Kryloss',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Terms of Service | Kryloss',
        description: 'Read the terms and conditions for using Kryloss productivity platform and associated services.',
    },
    alternates: {
        canonical: 'https://kryloss.com/terms',
    },
}

const lastUpdated = '2024-01-15T00:00:00Z'

const tableOfContents = [
    { id: 'acceptance', title: 'Acceptance of Terms' },
    { id: 'about-us', title: 'About Kryloss' },
    { id: 'accounts', title: 'User Accounts & Security' },
    { id: 'acceptable-use', title: 'Acceptable Use Policy' },
    { id: 'intellectual-property', title: 'Intellectual Property & Licensing' },
    { id: 'third-party', title: 'Third-Party Services' },
    { id: 'disclaimers', title: 'Disclaimers & Limitation of Liability' },
    { id: 'termination', title: 'Account Termination' },
    { id: 'governing-law', title: 'Governing Law & Jurisdiction' },
    { id: 'changes', title: 'Changes to Terms' },
    { id: 'contact', title: 'Contact Information' },
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

export default function TermsOfServicePage() {
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
                        Terms of Service
                    </h1>
                    <p className="text-lg text-[#9CA9B7] mb-6 max-w-3xl mx-auto">
                        These terms govern your use of the Kryloss productivity platform. Please read them carefully before using our services.
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

                                    {/* Acceptance */}
                                    <section id="acceptance" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Acceptance of Terms</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            By accessing or using the Kryloss platform (kryloss.com) and its associated services, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use our services.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            These Terms constitute a legally binding agreement between you and Kryloss. Your use of our services is also governed by our{" "}
                                            <Link href="/privacy" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                Privacy Policy
                                            </Link>, which is incorporated by reference into these Terms.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            You must be at least 13 years old to use our services. If you are under 18, you represent that you have your parent&apos;s or guardian&apos;s permission to use our services.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* About Us */}
                                    <section id="about-us" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">About Kryloss</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Kryloss operates as a centralized productivity dashboard that provides access to various tools and services designed to enhance your productivity and workflow management. Our platform includes but is not limited to:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li><strong className="text-[#FBF7FA]">Main Dashboard:</strong> Central hub for accessing all tools and services</li>
                                            <li><strong className="text-[#FBF7FA]">Healthify:</strong> Health analytics and tracking platform</li>
                                            <li><strong className="text-[#FBF7FA]">Notify:</strong> Smart notification management system</li>
                                            <li><strong className="text-[#FBF7FA]">Additional Tools:</strong> Future productivity services as they become available</li>
                                        </ul>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            We reserve the right to modify, suspend, or discontinue any part of our services at any time with reasonable notice to users.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Accounts & Security */}
                                    <section id="accounts" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">User Accounts & Security</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Account Registration</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>You must provide accurate and complete information when creating an account</li>
                                            <li>You are responsible for maintaining the accuracy of your account information</li>
                                            <li>One account per person is permitted</li>
                                            <li>You may not create accounts for automated or non-human use</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Account Security</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>You are solely responsible for maintaining the security of your login credentials</li>
                                            <li>You must notify us immediately of any unauthorized access to your account</li>
                                            <li>You are responsible for all activities that occur under your account</li>
                                            <li>We recommend using strong, unique passwords and enabling two-factor authentication when available</li>
                                        </ul>

                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            Kryloss will not be liable for any loss or damage arising from your failure to comply with these security requirements.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Acceptable Use */}
                                    <section id="acceptable-use" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Acceptable Use Policy</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            You agree to use our services responsibly and in compliance with all applicable laws. The following activities are prohibited:
                                        </p>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Prohibited Activities</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Violating any local, state, national, or international law or regulation</li>
                                            <li>Transmitting or storing illegal, harmful, threatening, abusive, or defamatory content</li>
                                            <li>Sending spam, unsolicited communications, or engaging in phishing activities</li>
                                            <li>Attempting to gain unauthorized access to our systems or other users&apos; accounts</li>
                                            <li>Introducing viruses, malware, or other malicious code</li>
                                            <li>Reverse engineering, decompiling, or attempting to extract source code</li>
                                            <li>Using automated tools to access our services without permission</li>
                                            <li>Impersonating others or misrepresenting your identity</li>
                                            <li>Interfering with or disrupting our services or servers</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Enforcement</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            We reserve the right to investigate violations of this policy and take appropriate action, including warning users, suspending or terminating accounts, and cooperating with law enforcement when necessary.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* IP & Licensing */}
                                    <section id="intellectual-property" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Intellectual Property & Licensing</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Our Content</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            The Kryloss platform, including its design, functionality, text, graphics, logos, and source code, is owned by Kryloss and protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use our services for their intended purpose.
                                        </p>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Your Content</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            You retain all rights to any content you submit, upload, or store through our services (&quot;User Content&quot;). However, by using our services, you grant us a worldwide, non-exclusive, royalty-free license to:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Store, process, and transmit your User Content as necessary to provide our services</li>
                                            <li>Make backup copies for security and service continuity purposes</li>
                                            <li>Display your User Content back to you through our platform</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Restrictions</h3>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>You may not copy, modify, or distribute our proprietary content</li>
                                            <li>You may not remove or alter any copyright, trademark, or other proprietary notices</li>
                                            <li>You may not use our trademarks or logos without explicit written permission</li>
                                        </ul>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Third Party */}
                                    <section id="third-party" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Third-Party Services</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Our platform integrates with various third-party services to provide functionality:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li><strong className="text-[#FBF7FA]">Supabase:</strong> Database and authentication services</li>
                                            <li><strong className="text-[#FBF7FA]">Resend:</strong> Email delivery and communications</li>
                                            <li><strong className="text-[#FBF7FA]">Google Services:</strong> Optional OAuth authentication</li>
                                            <li><strong className="text-[#FBF7FA]">Vercel:</strong> Hosting and deployment infrastructure</li>
                                        </ul>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the availability, content, or practices of third-party services.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            We may add, modify, or remove third-party integrations at any time. While we strive to work with reputable service providers, we cannot guarantee the performance or availability of external services.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Disclaimers */}
                                    <section id="disclaimers" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Disclaimers & Limitation of Liability</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Service Disclaimers</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            OUR SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Warranties of merchantability, fitness for a particular purpose, and non-infringement</li>
                                            <li>Warranties regarding the accuracy, reliability, or completeness of our services</li>
                                            <li>Warranties that our services will be uninterrupted, secure, or error-free</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Limitation of Liability</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, KRYLOSS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Loss of profits, data, use, goodwill, or other intangible losses</li>
                                            <li>Damages resulting from unauthorized access to or alteration of your data</li>
                                            <li>Damages resulting from any conduct or content of third parties</li>
                                            <li>Damages resulting from interruption or cessation of our services</li>
                                        </ul>

                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Termination */}
                                    <section id="termination" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Account Termination</h2>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Termination by You</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            You may terminate your account at any time by contacting us or using account deletion features when available. Upon termination:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Your access to our services will be immediately suspended</li>
                                            <li>Your data will be deleted according to our data retention policy</li>
                                            <li>You remain responsible for any outstanding obligations</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Termination by Us</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We may suspend or terminate your account if you:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Violate these Terms or our Acceptable Use Policy</li>
                                            <li>Engage in fraudulent or illegal activities</li>
                                            <li>Compromise the security or integrity of our services</li>
                                            <li>Remain inactive for an extended period (with reasonable notice)</li>
                                        </ul>

                                        <h3 className="text-xl font-semibold text-[#FBF7FA] mb-3">Effect of Termination</h3>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            Upon termination, all rights and licenses granted to you will immediately cease. Provisions of these Terms that by their nature should survive termination shall remain in effect, including intellectual property rights, disclaimer of warranties, and limitation of liability.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Governing Law */}
                                    <section id="governing-law" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Governing Law & Jurisdiction</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Any disputes arising out of or relating to these Terms or our services shall be resolved through binding arbitration or in the courts of [Your Jurisdiction], and you consent to the personal jurisdiction of such courts.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            <em className="text-[#556274]">
                                                Note: Please update the jurisdiction information to reflect your actual legal jurisdiction and preferred dispute resolution process.
                                            </em>
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Changes */}
                                    <section id="changes" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Changes to Terms</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            We reserve the right to modify these Terms at any time. When we make significant changes, we will:
                                        </p>
                                        <ul className="text-[#9CA9B7] leading-relaxed mb-4 space-y-2 list-disc list-inside">
                                            <li>Update the &quot;Last updated&quot; date at the top of this document</li>
                                            <li>Notify you via email if you have an account with us</li>
                                            <li>Display a prominent notice on our website</li>
                                            <li>Provide advance notice for material changes when possible</li>
                                        </ul>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            Your continued use of our services after any changes indicates your acceptance of the updated Terms. If you do not agree to the modified Terms, you must stop using our services.
                                        </p>
                                        <p className="text-[#9CA9B7] leading-relaxed">
                                            For significant changes that materially affect your rights, we may require explicit acceptance before you can continue using our services.
                                        </p>
                                    </section>

                                    <Separator className="my-8 bg-[#2A3442]" />

                                    {/* Contact */}
                                    <section id="contact" className="mb-12">
                                        <h2 className="text-2xl font-bold text-[#FBF7FA] mb-4">Contact Information</h2>
                                        <p className="text-[#9CA9B7] leading-relaxed mb-4">
                                            If you have any questions about these Terms of Service, please contact us:
                                        </p>
                                        <div className="bg-[#0F101A] border border-[#2A3442] rounded-xl p-4">
                                            <p className="text-[#FBF7FA] font-medium mb-2">Support Team</p>
                                            <p className="text-[#9CA9B7]">
                                                Email:{" "}
                                                <Link href="mailto:support@kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                    support@kryloss.com
                                                </Link>
                                            </p>
                                            <p className="text-[#9CA9B7]">
                                                Website:{" "}
                                                <Link href="https://kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                    kryloss.com
                                                </Link>
                                            </p>
                                        </div>
                                        <p className="text-[#9CA9B7] leading-relaxed mt-4">
                                            For legal inquiries, you may also contact our legal team at{" "}
                                            <Link href="mailto:legal@kryloss.com" className="text-[#4AA7FF] hover:text-[#90C9FF] underline">
                                                legal@kryloss.com
                                            </Link>.
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
