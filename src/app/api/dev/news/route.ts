import { NextRequest, NextResponse } from 'next/server'
import { writeFileSync, readFileSync } from 'fs'
import { join } from 'path'
import type { Update } from '@/lib/updates'

const UPDATES_FILE = join(process.cwd(), 'src/lib/updates.ts')

// Get updates
export async function GET() {
    try {
        const fileContent = readFileSync(UPDATES_FILE, 'utf-8')
        const match = fileContent.match(/export const updates: Update\[\] = (\[[\s\S]*?\])\s*$/m)
        
        if (!match) {
            return NextResponse.json({ error: 'Could not parse updates file' }, { status: 500 })
        }

        const updatesArray = JSON.parse(match[1])
        return NextResponse.json({ updates: updatesArray })
    } catch (error) {
        console.error('Error reading updates:', error)
        return NextResponse.json({ error: 'Failed to read updates' }, { status: 500 })
    }
}

// Save updates
export async function POST(request: NextRequest) {
    try {
        const { updates }: { updates: Update[] } = await request.json()

        // Sort updates and normalize the structure
        const normalizedUpdates = updates.map(update => ({
            id: update.id,
            title: update.title,
            summary: update.summary,
            date: update.date,
            link: update.link,
            category: update.category
        }))

        // Generate the TypeScript file content
        const fileContent = `export interface Update {
    id: string
    title: string
    summary: string
    date: string
    link: string
    category: string
}

export const updates: Update[] = ${JSON.stringify(normalizedUpdates, null, 4)}
`

        // Write to file
        writeFileSync(UPDATES_FILE, fileContent, 'utf-8')

        return NextResponse.json({ success: true, message: 'Updates saved successfully' })
    } catch (error) {
        console.error('Error saving updates:', error)
        return NextResponse.json({ error: 'Failed to save updates' }, { status: 500 })
    }
}