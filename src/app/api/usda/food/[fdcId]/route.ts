import { NextRequest, NextResponse } from 'next/server'

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ fdcId: string }> }
) {
    try {
        const { fdcId } = await params

        if (!fdcId) {
            return NextResponse.json(
                { error: 'FDC ID is required' },
                { status: 400 }
            )
        }

        const response = await fetch(`${USDA_BASE_URL}/food/${fdcId}?api_key=${USDA_API_KEY}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NutritionApp/1.0'
            }
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Food not found' },
                    { status: 404 }
                )
            }
            console.error(`USDA API error: ${response.status} ${response.statusText}`)
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Error proxying USDA food details request:', error)
        return NextResponse.json(
            { error: 'Failed to get food details' },
            { status: 500 }
        )
    }
}