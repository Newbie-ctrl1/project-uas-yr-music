import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const API_KEY = process.env.YOUTUBE_API_KEY
    const baseUrl = 'https://www.googleapis.com/youtube/v3/search'
    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '10',
      q: query + ' music',
      type: 'video',
      videoCategoryId: '10', // Music category
      key: API_KEY
    })

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: {
        'Referer': 'http://localhost:3000',
        'Origin': 'http://localhost:3000'
      }
    })
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch from YouTube API')
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('YouTube API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from YouTube API' },
      { status: 500 }
    )
  }
} 