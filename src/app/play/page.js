'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  PlayCircle, 
  PauseCircle, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Repeat, 
  Shuffle,
  Heart,
  Share2,
  ListMusic,
  Search
} from 'lucide-react'
import Image from 'next/image'

export default function PlayPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState(0)
  const [volume, setVolume] = useState(50)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isRepeat, setIsRepeat] = useState(false)
  const [isShuffle, setIsShuffle] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const playerRef = useRef(null)
  const youtubeReadyCallbackRef = useRef(null)

  const defaultSongs = []

  const [songList, setSongList] = useState(defaultSongs)

  const handleNext = useCallback(() => {
    let nextIndex
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songList.length)
    } else {
      nextIndex = (currentSong + 1) % songList.length
    }
    setCurrentSong(nextIndex)
    if (playerRef.current) {
      playerRef.current.loadVideoById(songList[nextIndex].videoId)
    }
  }, [isShuffle, songList, currentSong])

  const handlePrevious = () => {
    let prevIndex
    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * songList.length)
    } else {
      prevIndex = currentSong === 0 ? songList.length - 1 : currentSong - 1
    }
    setCurrentSong(prevIndex)
    if (playerRef.current) {
      playerRef.current.loadVideoById(songList[prevIndex].videoId)
    }
  }

  const handlePlayPause = () => {
    if (!playerRef.current) return

    try {
      if (isPlaying) {
        if (typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo()
        }
      } else {
        if (typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo()
        }
      }
      setIsPlaying(!isPlaying)
    } catch (error) {
      console.error('Error handling play/pause:', error)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume)
    }
  }

  const handleProgressChange = (e) => {
    const newProgress = parseInt(e.target.value)
    setProgress(newProgress)
    if (playerRef.current) {
      const newTime = (duration * newProgress) / 100
      playerRef.current.seekTo(newTime)
    }
  }

  useEffect(() => {
    // Load YouTube IFrame API
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    // Define initializePlayer inside useEffect
    const initializePlayer = () => {
      if (!window.YT || !songList.length) return

      if (playerRef.current) {
        playerRef.current.destroy()
      }

      const container = document.getElementById('youtube-player')
      if (!container) {
        console.error('Player container not found')
        return
      }

      try {
        playerRef.current = new window.YT.Player('youtube-player', {
          height: '360',
          width: '640',
          videoId: songList[currentSong]?.videoId || '',
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            showinfo: 0
          },
          events: {
            onReady: (event) => {
              console.log('Player ready')
              event.target.setVolume(volume)
            },
            onStateChange: (event) => {
              console.log('Player state changed:', event.data)
              if (event.data === window.YT.PlayerState.ENDED) {
                handleNext()
              }
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
            },
            onError: (event) => {
              console.error('Player error:', event.data)
            }
          }
        })
      } catch (error) {
        console.error('Error initializing player:', error)
      }
    }

    // Inisialisasi player saat ada lagu dalam daftar putar
    if (songList.length > 0) {
      if (window.YT) {
        initializePlayer()
      } else {
        youtubeReadyCallbackRef.current = initializePlayer
        window.onYouTubeIframeAPIReady = () => {
          if (youtubeReadyCallbackRef.current) {
            youtubeReadyCallbackRef.current()
          }
        }
      }
    }
    
    return () => {
      window.onYouTubeIframeAPIReady = null
      youtubeReadyCallbackRef.current = null
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying player:', error)
        }
      }
      playerRef.current = null
    }
  }, [songList, currentSong, volume, handleNext])

  // Update progress bar
  useEffect(() => {
    if (!playerRef.current || !isPlaying) return

    const interval = setInterval(() => {
      try {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const currentTime = playerRef.current.getCurrentTime()
          const videoDuration = playerRef.current.getDuration()
          if (!isNaN(currentTime) && !isNaN(videoDuration) && videoDuration > 0) {
            setDuration(videoDuration)
            setProgress((currentTime / videoDuration) * 100)
          }
        }
      } catch (error) {
        console.error('Error updating progress:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying])

  // Tambahkan useEffect baru untuk menginisialisasi durasi saat lagu berubah
  useEffect(() => {
    const initializeDuration = () => {
      try {
        if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
          const videoDuration = playerRef.current.getDuration()
          if (!isNaN(videoDuration) && videoDuration > 0) {
            setDuration(videoDuration)
          }
        }
      } catch (error) {
        console.error('Error getting duration:', error)
      }
    }

    // Tunggu sebentar setelah lagu berubah untuk memastikan player sudah siap
    const timer = setTimeout(initializeDuration, 1000)
    return () => clearTimeout(timer)
  }, [currentSong])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/youtube?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.items) {
        const newSongs = data.items.slice(0, 5).map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          album: 'YouTube Music',
          duration: '0:00',
          image: `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
          videoId: item.id.videoId
        }))
        setSearchResults(newSongs)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const addToPlaylist = (song) => {
    const newSongList = [...songList, song]
    setSongList(newSongList)
    
    // Jika ini lagu pertama, set sebagai lagu yang aktif
    if (songList.length === 0) {
      setCurrentSong(0)
      // Re-inisialisasi player jika sudah ada
      if (window.YT && playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
        setTimeout(() => {
          const initializePlayer = () => {
            playerRef.current = new window.YT.Player('youtube-player', {
              height: '360',
              width: '640',
              videoId: song.videoId,
              playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                rel: 0,
                modestbranding: 1,
                showinfo: 0
              },
              events: {
                onReady: (event) => {
                  event.target.setVolume(volume)
                },
                onStateChange: (event) => {
                  if (event.data === window.YT.PlayerState.ENDED) {
                    handleNext()
                  }
                  setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
                }
              }
            })
          }
          initializePlayer()
        }, 100)
      }
    }
    
    setSearchResults([])
    setSearchQuery('')
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Putar Musik</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cari musik..."
                className="bg-black/30 text-white px-3 py-1.5 rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            <button className="text-gray-400 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Album Art & Controls */}
          <div className="lg:col-span-2 bg-black/30 p-4 rounded-2xl backdrop-blur-sm">
            {songList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                <Search className="w-16 h-16 mb-4" />
                <p className="text-lg">Cari dan tambahkan lagu untuk memulai</p>
              </div>
            ) : (
              <>
                <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-4 shadow-2xl">
                  <div id="youtube-player" className="absolute inset-0 w-full h-full"></div>
                  {!isPlaying && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <button 
                        onClick={handlePlayPause}
                        className="bg-purple-600/80 p-4 rounded-full hover:bg-purple-700 transition-colors text-white"
                      >
                        <PlayCircle className="w-8 h-8" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-white mb-1">
                    {songList[currentSong].title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {songList[currentSong].artist} • {songList[currentSong].album}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(duration * (progress / 100))}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button 
                    className={`text-gray-400 hover:text-white transition-colors ${isShuffle ? 'text-purple-500' : ''}`}
                    onClick={() => setIsShuffle(!isShuffle)}
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={handlePrevious}
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={handlePlayPause}
                    className="bg-purple-600 p-2 rounded-full hover:bg-purple-700 transition-colors text-white"
                  >
                    {isPlaying ? (
                      <PauseCircle className="w-6 h-6" />
                    ) : (
                      <PlayCircle className="w-6 h-6" />
                    )}
                  </button>
                  <button 
                    className="text-gray-400 hover:text-white transition-colors"
                    onClick={handleNext}
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  <button 
                    className={`text-gray-400 hover:text-white transition-colors ${isRepeat ? 'text-purple-500' : ''}`}
                    onClick={() => setIsRepeat(!isRepeat)}
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Playlist and Search Results */}
          <div className="bg-black/30 p-4 rounded-2xl backdrop-blur-sm">
            <div className="flex flex-col h-full">
              {/* Playlist Section */}
              {songList.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-base font-bold text-white mb-3">Daftar Putar</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {songList.map((song, index) => (
                      <div 
                        key={song.id} 
                        className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer
                          ${index === currentSong ? 'bg-purple-600/30 text-white' : 'hover:bg-white/5 text-gray-300'}`}
                        onClick={() => {
                          setCurrentSong(index)
                          if (playerRef.current) {
                            playerRef.current.loadVideoById(song.videoId)
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded overflow-hidden">
                            <Image
                              src={song.image}
                              alt={song.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium line-clamp-1 text-sm">{song.title}</h3>
                            <p className="text-xs text-gray-400">{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="text-gray-400 hover:text-white transition-colors">
                            <Heart className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs text-gray-400 ml-2">{song.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results Section */}
              {searchResults.length > 0 ? (
                <div>
                  <h3 className="text-base font-bold text-white mb-3">Hasil Pencarian</h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {searchResults.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 text-gray-300 transition-all cursor-pointer"
                        onClick={() => addToPlaylist(song)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded overflow-hidden">
                            <Image
                              src={song.image}
                              alt={song.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium line-clamp-1 text-sm">{song.title}</h3>
                            <p className="text-xs text-gray-400">{song.artist}</p>
                          </div>
                        </div>
                        <button className="text-gray-400 hover:text-white transition-colors">
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : songList.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Belum ada lagu dalam daftar putar</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 