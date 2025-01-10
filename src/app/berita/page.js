'use client'

import { useState, useEffect } from 'react'
import { Newspaper, Calendar, ArrowRight, Clock, TrendingUp } from 'lucide-react'
import Image from 'next/image'

export default function Berita() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/news')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch news')
        }
        setNews(data.articles || [])
      } catch (err) {
        console.error('Error fetching news:', err)
        setError(err.message || 'Failed to fetch news')
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [])

  const handleImageError = (e) => {
    const imgElement = e.target
    if (imgElement && imgElement.parentElement) {
      const container = imgElement.parentElement
      container.style.backgroundColor = '#f3f4f6'
      container.innerHTML = `
        <div class="flex items-center justify-center w-full h-full text-gray-400">
          <span>Gambar tidak tersedia</span>
        </div>
      `
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4">
                  <div className="aspect-video bg-gray-200 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    )
  }

  if (!news?.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tidak Ada Data</h2>
          <p className="text-gray-600 mb-6">Tidak ada berita yang tersedia saat ini.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            Muat Ulang
          </button>
        </div>
      </div>
    )
  }

  // Pisahkan berita utama dan berita lainnya
  const mainNews = news[0]
  const otherNews = news.slice(1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Newspaper className="w-8 h-8 text-purple-500" />
            <h1 className="text-2xl font-bold text-gray-900">Berita Musik Terkini</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Diperbarui {new Date().toLocaleDateString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>

        {/* Main News */}
        <div className="mb-12">
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="relative aspect-[21/9] bg-gray-100">
              {mainNews.urlToImage ? (
                <Image 
                  src={mainNews.urlToImage}
                  alt={mainNews.title}
                  fill
                  className="object-cover"
                  onError={handleImageError}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-gray-400">
                  <span>Gambar tidak tersedia</span>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(mainNews.publishedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span className="text-purple-500 font-medium">{mainNews.source.name}</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-purple-600 transition-colors">
                {mainNews.title}
              </h2>
              <p className="text-gray-600 mb-4 line-clamp-3">
                {mainNews.description}
              </p>
              <a 
                href={mainNews.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Baca Selengkapnya
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Other News Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherNews.map((article, index) => (
            <div key={index} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
              <div className="aspect-[16/9] bg-gray-100 relative">
                {article.urlToImage ? (
                  <Image 
                    src={article.urlToImage}
                    alt={article.title}
                    fill
                    className="object-cover"
                    onError={handleImageError}
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-400">
                    <span>Gambar tidak tersedia</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(article.publishedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                  </div>
                  <span className="text-purple-500 font-medium">{article.source.name}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                  {article.description}
                </p>
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                >
                  Baca Selengkapnya
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 