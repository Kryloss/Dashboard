import { Hero } from "@/components/hero"
import { UpdateCard } from "@/components/update-card"
import { updates } from "@/lib/updates"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0C0D]">
      {/* Hero Section */}
      <Hero />

      {/* Updates/News Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#FBF7FA] mb-4 tracking-tight">
              Latest Updates
            </h2>
            <p className="text-xl text-[#9CA9B7] max-w-2xl mx-auto">
              Stay up to date with new features, improvements, and announcements
              across the Kryloss platform ecosystem.
            </p>
          </div>

          {/* Updates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {updates.slice(0, 6).map((update) => (
              <UpdateCard
                key={update.id}
                title={update.title}
                summary={update.summary}
                date={update.date}
                link={update.link}
                category={update.category}
              />
            ))}
          </div>

          {/* View All Updates CTA */}
          <div className="text-center">
            <Button
              variant="outline"
              size="lg"
              asChild
              className="rounded-full border-[#2A3442] bg-transparent text-[#FBF7FA] hover:bg-white/5 hover:text-white hover:border-[#344253] focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#0B0C0D] transition-all px-8 py-3"
            >
              <Link href="/updates">View All Updates</Link>
            </Button>
          </div>
        </div>
      </section>


    </div>
  )
}
