import { NextRequest, NextResponse } from 'next/server'

const USDA_BASE_URL = 'https://api.nal.usda.gov/fdc/v1'
const USDA_API_KEY = process.env.NEXT_PUBLIC_USDA_API_KEY || 'DEMO_KEY'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')
        const pageSize = searchParams.get('pageSize') || '25'

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ foods: [] })
        }

        const usdaSearchParams = new URLSearchParams({
            query: query.trim(),
            dataType: 'Foundation,SR Legacy,Survey (FNDDS),Branded',
            pageSize: pageSize,
            sortBy: 'dataType.keyword',
            sortOrder: 'asc',
            api_key: USDA_API_KEY
        })

        const response = await fetch(`${USDA_BASE_URL}/foods/search?${usdaSearchParams}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NutritionApp/1.0'
            }
        })

        if (!response.ok) {
            console.error(`USDA API error: ${response.status} ${response.statusText}`)
            throw new Error(`USDA API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return NextResponse.json(data)

    } catch (error) {
        console.error('Error proxying USDA search request:', error)
        return NextResponse.json(
            { error: 'Failed to search foods', foods: [] },
            { status: 500 }
        )
    }
}