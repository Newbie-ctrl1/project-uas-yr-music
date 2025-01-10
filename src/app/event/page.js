'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, MapPin, Clock, Users, Music2, Upload, X, Plus, Ticket, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function EventPage() {
  const router = useRouter()
  const [events, setEvents] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    date: '',
    time: '',
    location: '',
    description: '',
    poster: null,
    ticketPrice: '',
    ticketQuantity: ''
  })
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)

  // Pindahkan fetchEvents ke level komponen
  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/event')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data event')
      }

      // Filter event berdasarkan userId jika ada
      if (userId) {
        const userEvents = data.filter(event => event.userId === userId)
        setEvents(userEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      alert(error.message)
    } finally {
      setIsLoading(false)
    }
  }, [userId]) // Tambahkan userId sebagai dependency

  // Cek login saat komponen dimount
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserId(payload.userId)
    } catch (error) {
      console.error('Error parsing token:', error)
      localStorage.removeItem('token')
      router.push('/login')
    }
  }, [router])

  // Effect untuk fetch events ketika userId berubah
  useEffect(() => {
    if (userId) {
      fetchEvents()
    }
  }, [userId, fetchEvents])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setFormData(prev => ({
          ...prev,
          poster: file
        }))
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
        setErrors(prev => ({
          ...prev,
          poster: ''
        }))
      } else {
        setErrors(prev => ({
          ...prev,
          poster: 'File harus berupa gambar'
        }))
      }
    }
  }

  const removePoster = () => {
    setFormData(prev => ({
      ...prev,
      poster: null
    }))
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = 'Nama event wajib diisi'
    if (!formData.type) newErrors.type = 'Jenis event wajib dipilih'
    if (!formData.date) newErrors.date = 'Tanggal wajib diisi'
    if (!formData.time) newErrors.time = 'Waktu wajib diisi'
    if (!formData.location.trim()) newErrors.location = 'Lokasi wajib diisi'
    if (!formData.description.trim()) newErrors.description = 'Deskripsi wajib diisi'
    if (!isEditMode && !formData.poster) newErrors.poster = 'Poster event wajib diunggah'
    if (!formData.ticketPrice) newErrors.ticketPrice = 'Harga tiket wajib diisi'
    if (formData.ticketPrice <= 0) newErrors.ticketPrice = 'Harga tiket harus lebih dari 0'
    if (!formData.ticketQuantity) newErrors.ticketQuantity = 'Jumlah tiket wajib diisi'
    if (formData.ticketQuantity <= 0) newErrors.ticketQuantity = 'Jumlah tiket harus lebih dari 0'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEdit = (event) => {
    setSelectedEvent(event)
    setFormData({
      name: event.name,
      type: event.type,
      date: new Date(event.date).toISOString().split('T')[0],
      time: event.time,
      location: event.location,
      description: event.description,
      poster: null,
      ticketPrice: event.ticketPrice.toString(),
      ticketQuantity: event.ticketQuantity.toString()
    })
    setIsEditMode(true)
    setIsModalOpen(true)
  }

  const handleDelete = async (eventId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus event ini?')) return

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      const response = await fetch(`/api/event?id=${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus event')
      }

      // Hapus event dari state
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId))
      alert('Event berhasil dihapus')

    } catch (error) {
      console.error('Error deleting event:', error)
      alert(error.message || 'Terjadi kesalahan saat menghapus event')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      // Buat FormData untuk mengirim file
      const form = new FormData()
      
      if (isEditMode) {
        form.append('id', selectedEvent.id)
      }
      
      form.append('name', formData.name)
      form.append('type', formData.type)
      form.append('date', formData.date)
      form.append('time', formData.time)
      form.append('location', formData.location)
      form.append('description', formData.description)
      if (formData.poster) {
        form.append('poster', formData.poster)
      }
      form.append('ticketPrice', formData.ticketPrice)
      form.append('ticketQuantity', formData.ticketQuantity)

      const response = await fetch('/api/event', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Gagal ${isEditMode ? 'mengupdate' : 'membuat'} event`)
      }

      alert(`Event berhasil ${isEditMode ? 'diupdate' : 'dibuat'}!`)
      
      // Refresh data events
      await fetchEvents()
      
      // Reset form dan tutup modal
      setFormData({
        name: '',
        type: '',
        date: '',
        time: '',
        location: '',
        description: '',
        poster: null,
        ticketPrice: '',
        ticketQuantity: ''
      })
      removePoster()
      setIsModalOpen(false)
      setIsEditMode(false)
      setSelectedEvent(null)

    } catch (error) {
      console.error('Error submitting form:', error)
      alert(error.message || `Terjadi kesalahan saat ${isEditMode ? 'mengupdate' : 'membuat'} event`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tambahkan fungsi untuk mendapatkan placeholder image
  const getPlaceholderImage = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNmIyMWE4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSI+RXZlbnQgUG9zdGVyPC90ZXh0Pjwvc3ZnPg=='
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold text-white">Event Musik</h1>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white"
          >
            <Plus className="w-5 h-5" />
            Buat Event
          </button>
        </div>

        {/* Event List */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-12">Memuat data event...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Belum ada event yang dibuat</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event.id} className="bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden">
                <div className="flex items-center">
                  <div className="relative w-24 h-24">
                    <Image
                      src={event.posterUrl || getPlaceholderImage()}
                      alt={event.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={false}
                      unoptimized={event.posterUrl?.startsWith('data:')}
                    />
                  </div>
                  <div className="flex-1 p-3">
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-white">{event.name}</h3>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-300 text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Ticket className="w-3 h-3" />
                            <span>Rp {parseInt(event.ticketPrice).toLocaleString('id-ID')} • {event.ticketQuantity} tiket</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(event)}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors text-white text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-white text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-500" />
                  <h2 className="text-2xl font-bold text-white">
                    {isEditMode ? 'Edit Event Musik' : 'Buat Event Musik'}
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setIsEditMode(false)
                    setSelectedEvent(null)
                    setFormData({
                      name: '',
                      type: '',
                      date: '',
                      time: '',
                      location: '',
                      description: '',
                      poster: null,
                      ticketPrice: '',
                      ticketQuantity: ''
                    })
                    removePoster()
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form fields */}
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-gray-300 mb-1 block">Nama Event</span>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                        ${errors.name ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                      placeholder="Masukkan nama event"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </label>

                  <label className="block">
                    <span className="text-gray-300 mb-1 block">Jenis Event</span>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                        ${errors.type ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                    >
                      <option value="">Pilih jenis event</option>
                      <option value="concert">Konser</option>
                      <option value="festival">Festival</option>
                      <option value="workshop">Workshop Musik</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-gray-300 mb-1 block">Tanggal</span>
                      <div className="relative">
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                            ${errors.date ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}
                            [&::-webkit-calendar-picker-indicator]:bg-purple-500 
                            [&::-webkit-calendar-picker-indicator]:hover:bg-purple-400
                            [&::-webkit-calendar-picker-indicator]:rounded
                            [&::-webkit-calendar-picker-indicator]:p-1
                            [&::-webkit-calendar-picker-indicator]:cursor-pointer
                            [&::-webkit-calendar-picker-indicator]:opacity-100`}
                        />
                      </div>
                      {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
                    </label>

                    <label className="block">
                      <span className="text-gray-300 mb-1 block">Waktu</span>
                      <div className="relative">
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          className={`w-full px-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                            ${errors.time ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}
                            [&::-webkit-calendar-picker-indicator]:bg-purple-500 
                            [&::-webkit-calendar-picker-indicator]:hover:bg-purple-400
                            [&::-webkit-calendar-picker-indicator]:rounded
                            [&::-webkit-calendar-picker-indicator]:p-1
                            [&::-webkit-calendar-picker-indicator]:cursor-pointer
                            [&::-webkit-calendar-picker-indicator]:opacity-100`}
                        />
                      </div>
                      {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time}</p>}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-gray-300 mb-1 block">Lokasi</span>
                    <div className="relative">
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className={`w-full pl-12 pr-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                          ${errors.location ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                        placeholder="Masukkan lokasi event"
                      />
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                    </div>
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-gray-300 mb-1 block">Harga Tiket (Rp)</span>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                        <input
                          type="number"
                          name="ticketPrice"
                          value={formData.ticketPrice}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                            ${errors.ticketPrice ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </div>
                      {errors.ticketPrice && <p className="text-red-500 text-sm mt-1">{errors.ticketPrice}</p>}
                    </label>

                    <label className="block">
                      <span className="text-gray-300 mb-1 block">Jumlah Tiket</span>
                      <div className="relative">
                        <input
                          type="number"
                          name="ticketQuantity"
                          value={formData.ticketQuantity}
                          onChange={handleChange}
                          className={`w-full pl-12 pr-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors
                            ${errors.ticketQuantity ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                          placeholder="0"
                          min="1"
                        />
                        <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">tiket</span>
                      </div>
                      {errors.ticketQuantity && <p className="text-red-500 text-sm mt-1">{errors.ticketQuantity}</p>}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-gray-300 mb-1 block">Deskripsi Event</span>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg bg-black/50 border focus:outline-none transition-colors h-32
                        ${errors.description ? 'border-red-500' : 'border-gray-700 focus:border-purple-500'}`}
                      placeholder="Deskripsikan event Anda"
                    ></textarea>
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </label>

                  <label className="block">
                    <span className="text-gray-300 mb-1 block">Upload Poster Event</span>
                    <div 
                      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                        ${errors.poster ? 'border-red-500' : 'border-gray-700 hover:border-purple-500'}`}
                      onClick={() => document.querySelector('input[type="file"]').click()}
                    >
                      <input
                        type="file"
                        name="poster"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                      />
                      
                      {(previewUrl || (isEditMode && selectedEvent?.posterUrl)) && (
                        <div className="relative aspect-[4/3] mt-4 rounded-lg overflow-hidden">
                          <Image
                            src={previewUrl || selectedEvent?.posterUrl || getPlaceholderImage()}
                            alt="Preview"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={false}
                            unoptimized={previewUrl?.startsWith('data:') || selectedEvent?.posterUrl?.startsWith('data:')}
                          />
                          <button
                            type="button"
                            onClick={removePoster}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {!previewUrl && !isEditMode && (
                        <>
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-400">Klik atau seret file poster ke sini</p>
                        </>
                      )}
                    </div>
                    {errors.poster && <p className="text-red-500 text-sm mt-1">{errors.poster}</p>}
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                      ${isSubmitting 
                        ? 'bg-purple-500/50 cursor-not-allowed' 
                        : 'bg-purple-500 hover:bg-purple-600'}`}
                  >
                    {isSubmitting 
                      ? `${isEditMode ? 'Menyimpan...' : 'Membuat Event...'}` 
                      : `${isEditMode ? 'Simpan Perubahan' : 'Buat Event'}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      setIsEditMode(false)
                      setSelectedEvent(null)
                      setFormData({
                        name: '',
                        type: '',
                        date: '',
                        time: '',
                        location: '',
                        description: '',
                        poster: null,
                        ticketPrice: '',
                        ticketQuantity: ''
                      })
                      removePoster()
                    }}
                    className="flex-1 px-4 py-2 rounded-lg font-medium border border-gray-700 hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 