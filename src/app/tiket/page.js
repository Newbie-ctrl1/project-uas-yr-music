'use client'

import { useState, useEffect } from 'react'
import { Ticket, Calendar, MapPin, Clock, Music2, Search, Filter, ArrowUpDown, X, Minus, Plus, Wallet } from 'lucide-react'
import Image from 'next/image'

export default function TiketPage() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState(null)

  // State untuk filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [sortBy, setSortBy] = useState('date-asc') // 'date-asc', 'date-desc', 'price-asc', 'price-desc'

  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [ticketQty, setTicketQty] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [selectedWalletType, setSelectedWalletType] = useState('Rendi Pay')
  const [wallets, setWallets] = useState([])

  useEffect(() => {
    fetchEvents()
    fetchWalletBalance()
    // Ambil userId dari token
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.userId)
      } catch (error) {
        console.error('Error parsing token:', error)
      }
    }
  }, [])

  // Effect untuk menerapkan filter
  useEffect(() => {
    let result = [...events]

    // Filter berdasarkan search query
    if (searchQuery) {
      result = result.filter(event => 
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter berdasarkan tipe event
    if (selectedType) {
      result = result.filter(event => event.type === selectedType)
    }

    // Filter berdasarkan range harga
    if (priceRange.min) {
      result = result.filter(event => event.ticketPrice >= parseInt(priceRange.min))
    }
    if (priceRange.max) {
      result = result.filter(event => event.ticketPrice <= parseInt(priceRange.max))
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date)
        case 'date-desc':
          return new Date(b.date) - new Date(a.date)
        case 'price-asc':
          return a.ticketPrice - b.ticketPrice
        case 'price-desc':
          return b.ticketPrice - a.ticketPrice
        default:
          return 0
      }
    })

    setFilteredEvents(result)
  }, [events, searchQuery, selectedType, priceRange, sortBy])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/event')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data event')
      }
      setEvents(data)
      setFilteredEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWalletBalance = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setWallets(data.wallets || [])
        // Set default wallet balance
        const defaultWallet = data.wallets?.find(w => w.type === 'Rendi Pay')
        setWalletBalance(defaultWallet?.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error)
    }
  }

  const handleWalletTypeChange = (type) => {
    setSelectedWalletType(type)
    const selectedWallet = wallets.find(w => w.type === type)
    setWalletBalance(selectedWallet?.balance || 0)
  }

  const handleBuyTicket = async (event) => {
    setSelectedEvent(event)
    setShowModal(true)
    setTicketQty(1)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedEvent(null)
    setTicketQty(1)
  }

  const handleQuantityChange = (action) => {
    if (action === 'increment' && ticketQty < 10) {
      setTicketQty(prev => prev + 1)
    } else if (action === 'decrement' && ticketQty > 1) {
      setTicketQty(prev => prev - 1)
    }
  }

  const handlePurchase = async () => {
    try {
      setIsProcessing(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/ticket/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: selectedEvent.id,
          quantity: ticketQty,
          totalAmount: selectedEvent.ticketPrice * ticketQty,
          walletType: selectedWalletType
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal melakukan pembelian')
      }

      alert('Pembelian tiket berhasil!')
      handleCloseModal()
      fetchWalletBalance() // Refresh saldo wallet
    } catch (error) {
      alert(error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePriceRangeChange = (type, value) => {
    setPriceRange(prev => ({
      ...prev,
      [type]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header & Search Filter Section */}
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 mb-4">
          <div className="flex flex-wrap items-center gap-4">
        {/* Header */}
            <div className="flex items-center gap-3 min-w-fit">
              <Ticket className="w-6 h-6 text-purple-500" />
              <h1 className="text-2xl font-bold text-white">Tiket Konser</h1>
        </div>

        {/* Search and Filter Section */}
            <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Search Box */}
              <div className="relative w-48">
              <input
                type="text"
                placeholder="Cari event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>

            {/* Event Type Filter */}
              <div className="relative w-40">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white appearance-none text-sm"
              >
                  <option value="">Semua Event</option>
                <option value="concert">Konser</option>
                <option value="festival">Festival</option>
                <option value="workshop">Workshop</option>
              </select>
              <Filter className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>

            {/* Price Range */}
              <div className="flex gap-2 w-48">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                className="w-full px-3 py-1.5 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                className="w-full px-3 py-1.5 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-400 text-sm"
              />
            </div>

            {/* Sort Options */}
              <div className="relative w-44">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 text-white appearance-none text-sm"
              >
                <option value="date-asc">Tanggal (Terlama)</option>
                <option value="date-desc">Tanggal (Terbaru)</option>
                <option value="price-asc">Harga (Termurah)</option>
                <option value="price-desc">Harga (Termahal)</option>
              </select>
              <ArrowUpDown className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">
            Memuat data event...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Ticket className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Tidak ada event yang sesuai dengan filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden">
                <div className="relative aspect-[3/2]">
                  <Image
                    src={event.posterUrl}
                    alt={event.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    priority={false}
                    unoptimized={event.posterUrl?.startsWith('data:')}
                  />
                </div>
                <div className="p-2">
                  <h2 className="text-sm font-bold text-white mb-1 truncate">{event.name}</h2>
                  <div className="flex items-center gap-1 text-purple-500 mb-1 text-xs">
                    <Music2 className="w-3 h-3" />
                    <span>{event.type}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-2 text-gray-300 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate">{new Date(event.date).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        <span className="truncate">{event.ticketQuantity} tiket</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{event.description}</p>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400">Mulai dari</p>
                      <p className="text-sm font-bold text-white">
                        Rp {parseInt(event.ticketPrice).toLocaleString('id-ID')}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {event.ticketQuantity > 0 ? `${event.ticketQuantity} tiket tersedia` : 'Tiket habis'}
                      </p>
                    </div>
                    {userId && userId === event.userId ? (
                      <button
                        disabled
                        className="px-2 py-0.5 bg-gray-500 cursor-not-allowed rounded-lg text-white text-xs font-medium opacity-50"
                      >
                        Event Anda
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyTicket(event)}
                        disabled={event.ticketQuantity <= 0}
                        className={`px-2 py-0.5 ${
                          event.ticketQuantity > 0 
                            ? 'bg-purple-500 hover:bg-purple-600' 
                            : 'bg-gray-500 cursor-not-allowed opacity-50'
                        } rounded-lg transition-colors text-white text-xs font-medium`}
                      >
                        {event.ticketQuantity > 0 ? 'Beli' : 'Habis'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Purchase Modal */}
        {showModal && selectedEvent && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
                <h3 className="text-xl font-bold text-white">Detail Pembelian</h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Event Details */}
                <div className="flex gap-4 mb-6">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Image
                      src={selectedEvent.posterUrl}
                      alt={selectedEvent.name}
                      fill
                      className="object-cover rounded-lg"
                      sizes="128px"
                      priority
                      unoptimized={selectedEvent.posterUrl?.startsWith('data:')}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">{selectedEvent.name}</h4>
                    <div className="flex items-center gap-2 text-purple-500 mb-2">
                      <Music2 className="w-4 h-4" />
                      <span>{selectedEvent.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-gray-300 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(selectedEvent.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{selectedEvent.time}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{selectedEvent.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4" />
                          <span>{selectedEvent.ticketQuantity} tiket tersedia</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-gray-400 text-sm">{selectedEvent.description}</p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white">Jumlah Tiket</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleQuantityChange('decrement')}
                        className="w-8 h-8 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={ticketQty <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium w-4 text-center">{ticketQty}</span>
                      <button
                        onClick={() => handleQuantityChange('increment')}
                        className="w-8 h-8 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={ticketQty >= selectedEvent.ticketQuantity || ticketQty >= 10}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>Harga per tiket</span>
                    <span>Rp {parseInt(selectedEvent.ticketPrice).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <h5 className="text-white font-medium mb-4">Detail Pembayaran</h5>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>Rp {(selectedEvent.ticketPrice * ticketQty).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-400">
                      <span>Biaya Layanan</span>
                      <span>Rp 0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-white font-medium pt-4 border-t border-gray-700">
                    <span>Total Pembayaran</span>
                    <span>Rp {(selectedEvent.ticketPrice * ticketQty).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Wallet Selection */}
                <div className="bg-black/30 rounded-lg p-4 mb-6">
                  <h5 className="text-white font-medium mb-4">Pilih Metode Pembayaran</h5>
                  <div className="grid grid-cols-3 gap-2">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.type}
                        onClick={() => handleWalletTypeChange(wallet.type)}
                        className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                          selectedWalletType === wallet.type
                            ? 'bg-purple-500 text-white'
                            : 'bg-black/30 text-gray-400 hover:bg-black/40'
                        }`}
                      >
                        {wallet.type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet Balance */}
                <div className="flex items-center justify-between bg-purple-500/20 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-purple-500">
                    <Wallet className="w-5 h-5" />
                    <span>Saldo {selectedWalletType}</span>
                  </div>
                  <span className="text-white font-medium">
                    Rp {walletBalance.toLocaleString('id-ID')}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-white font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handlePurchase}
                    disabled={isProcessing || walletBalance < (selectedEvent.ticketPrice * ticketQty)}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-white font-medium"
                  >
                    {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
                  </button>
                </div>
                
                {walletBalance < (selectedEvent.ticketPrice * ticketQty) && (
                  <p className="text-red-500 text-sm mt-2 text-center">
                    Saldo wallet tidak mencukupi. Silakan isi ulang wallet Anda.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 