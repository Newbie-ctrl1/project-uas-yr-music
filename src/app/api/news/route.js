import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?` +
      `q=music OR concert OR album OR artist&` +
      `domains=billboard.com,rollingstone.com,pitchfork.com&` +
      `language=en&` +
      `sortBy=publishedAt&` +
      `pageSize=12&` +
      `apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
    )

    const data = await response.json()
    console.log('API Response:', {
      status: data.status,
      totalResults: data.totalResults,
      articlesCount: data.articles?.length
    })

    if (data.status !== 'ok') {
      throw new Error(data.message || 'Failed to fetch news')
    }

    // Filter artikel yang memiliki gambar dan deskripsi
    const filteredArticles = data.articles.filter(article => 
      article.urlToImage && 
      article.description &&
      !article.description.includes('[Removed]')
    )

    return NextResponse.json({
      ...data,
      articles: filteredArticles
    })
  } catch (error) {
    console.error('News API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 