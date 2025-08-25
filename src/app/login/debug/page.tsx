"use client"

import { useCallback, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type ProbeResult = {
    label: string
    redirectTo: string
    url?: string
    error?: string
}

export default function LoginDebugPage() {
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState<ProbeResult[]>([])
    const [generalError, setGeneralError] = useState<string | null>(null)

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "(not set)"
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "(not set)"

    const candidates = useMemo(
        () => [
            { label: "window.location.origin", redirectTo: origin ? `${origin}/dashboard` : "" },
            { label: "NEXT_PUBLIC_SITE_URL", redirectTo: siteUrl && siteUrl !== "(not set)" ? `${siteUrl}/dashboard` : "" },
        ],
        [origin, siteUrl]
    )

    const runProbes = useCallback(async () => {
        setLoading(true)
        setGeneralError(null)
        setResults([])

        try {
            const supabase = createClient()
            const localResults: ProbeResult[] = []

            for (const c of candidates) {
                if (!c.redirectTo) {
                    localResults.push({ ...c, error: "redirectTo is empty" })
                    continue
                }
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: "google",
                        options: { redirectTo: c.redirectTo, skipBrowserRedirect: true },
                    })

                    if (error) {
                        localResults.push({ ...c, error: error.message })
                    } else if (data?.url) {
                        localResults.push({ ...c, url: data.url })
                    } else {
                        localResults.push({ ...c, error: "No data.url returned" })
                    }
                } catch (err) {
                    localResults.push({ ...c, error: err instanceof Error ? err.message : String(err) })
                }
            }

            setResults(localResults)
        } catch (err) {
            setGeneralError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }, [candidates])

    return (
        <div className="min-h-screen bg-[#000000] py-10">
            <div className="container mx-auto max-w-2xl px-6">
                <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl mb-6">
                    <div
                        className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                        style={{
                            background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)",
                        }}
                    />
                    <CardHeader>
                        <CardTitle className="text-[#FBF7FA]">Google Sign-In Debug</CardTitle>
                        <CardDescription className="text-[#9CA9B7]">
                            This page probes the OAuth redirect flow without navigating, to help diagnose issues in production.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[#9CA9B7]">Current URL</span>
                                <span className="text-[#FBF7FA] font-mono">{origin || "(server)"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#9CA9B7]">NEXT_PUBLIC_SITE_URL</span>
                                <span className="text-[#FBF7FA] font-mono">{siteUrl}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#9CA9B7]">NEXT_PUBLIC_SUPABASE_URL (host)</span>
                                <span className="text-[#FBF7FA] font-mono">
                                    {supabaseUrl !== "(not set)" ? (() => {
                                        try {
                                            const u = new URL(supabaseUrl)
                                            return u.host
                                        } catch {
                                            return supabaseUrl
                                        }
                                    })() : supabaseUrl}
                                </span>
                            </div>
                        </div>

                        {generalError && (
                            <div className="p-3 rounded-lg bg-[rgba(220,38,38,0.10)] border border-[rgba(220,38,38,0.35)] text-red-400 text-sm">
                                {generalError}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                type="button"
                                onClick={runProbes}
                                disabled={loading}
                                className="rounded-full bg-gradient-to-br from-[#114EB2] via-[#257ADA] to-[#4AA7FF] text-white shadow-[0_0_60px_rgba(37,122,218,0.35)] hover:from-[#257ADA] hover:to-[#90C9FF] hover:shadow-[0_0_72px_rgba(74,167,255,0.35)] hover:-translate-y-0.5 focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#121922] active:brightness-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed px-6"
                            >
                                {loading ? "Probing…" : "Run OAuth Probes"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Results */}
                {!!results.length && (
                    <Card className="bg-[#121922] border-[#2A3442] shadow-[0_8px_24px_rgba(0,0,0,0.40)] rounded-2xl">
                        <div
                            className="absolute top-0 left-0 right-0 h-[1px] rounded-t-2xl"
                            style={{
                                background: "linear-gradient(180deg, rgba(37,122,218,0.35) 0%, rgba(0,0,0,0) 100%)",
                            }}
                        />
                        <CardHeader>
                            <CardTitle className="text-[#FBF7FA] text-lg">Probe Results</CardTitle>
                            <CardDescription className="text-[#9CA9B7]">
                                Click the URL to verify it opens the Google consent screen.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {results.map((r, idx) => (
                                <div key={idx} className="rounded-xl border border-[#2A3442] p-3 bg-[#0F101A]">
                                    <div className="text-sm text-[#FBF7FA] font-medium mb-1">{r.label}</div>
                                    <div className="text-xs text-[#9CA9B7] mb-2">redirectTo: {r.redirectTo}</div>
                                    {r.url ? (
                                        <div className="text-xs">
                                            <a className="text-[#257ADA] hover:text-[#4AA7FF] underline" href={r.url} target="_blank" rel="noreferrer">
                                                Open OAuth URL ↗
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-red-400">{r.error || "Unknown error"}</div>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}


