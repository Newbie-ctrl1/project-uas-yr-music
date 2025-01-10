'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Wallet,
  Music,
  Bell,
  Settings,
  Edit,
  Loader2,
  Ticket
} from 'lucide-react'

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'profile'
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    birthDate: ''
  })
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [tickets, setTickets] = useState([])
  const [activeTicketFilter, setActiveTicketFilter] = useState('all')
  const [notifications, setNotifications] = useState([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Tambahkan fungsi toggleEdit
  const toggleEdit = () => {
    if (isEditing) {
      // Reset form ke data user sebelumnya jika membatalkan edit
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : ''
      })
    }
    setIsEditing(!isEditing)
    setError('')
    setSuccessMessage('')
  }

  useEffect(() => {
    // Ambil data user dari localStorage
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      // Update formData dengan data user yang ada
      setFormData({
        fullName: parsedUser.fullName || '',
        phone: parsedUser.phone || '',
        address: parsedUser.address || '',
        birthDate: parsedUser.birthDate ? new Date(parsedUser.birthDate).toISOString().split('T')[0] : ''
      })
      setIsLoading(false)
    } else {
      router.push('/auth/login')
    }
  }, [router])

  // Tambahkan effect untuk mengambil data tiket
  useEffect(() => {
    const fetchTickets = async () => {
      if (activeTab === 'tickets') {
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Token tidak ditemukan')
          }

          const response = await fetch('/api/ticket', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Gagal mengambil data tiket')
          }

          setTickets(data)
        } catch (error) {
          console.error('Error fetching tickets:', error)
          setError(error.message)
        }
      }
    }

    fetchTickets()
  }, [activeTab])

  // Tambahkan effect untuk mengambil notifikasi
  useEffect(() => {
    const fetchNotifications = async () => {
      if (activeTab === 'notifications') {
        setIsLoadingNotifications(true)
        setNotificationError('')
        try {
          const token = localStorage.getItem('token')
          if (!token) {
            throw new Error('Token tidak ditemukan')
          }

          const response = await fetch('/api/notifications', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Gagal mengambil notifikasi')
          }

          const data = await response.json()
          setNotifications(data)
        } catch (error) {
          console.error('Error fetching notifications:', error)
          setNotificationError(error.message)
        } finally {
          setIsLoadingNotifications(false)
        }
      }
    }

    fetchNotifications()
    
    // Set interval untuk polling notifikasi setiap 30 detik
    const intervalId = setInterval(fetchNotifications, 30000)

    return () => clearInterval(intervalId)
  }, [activeTab, refreshTrigger])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Reset pesan error dan success saat user mulai mengetik
    setError('')
    setSuccessMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      // Validasi dan sanitasi data
      const dataToSend = {}
      let hasChanges = false

      // Nama Lengkap
      if (formData.fullName !== user.fullName) {
        const cleanFullName = formData.fullName.trim()
        if (cleanFullName.length < 3) {
          throw new Error('Nama lengkap minimal 3 karakter')
        }
        if (cleanFullName.length > 50) {
          throw new Error('Nama lengkap maksimal 50 karakter')
        }
        dataToSend.fullName = cleanFullName
        hasChanges = true
      }

      // Nomor Telepon
      if (formData.phone !== user.phone) {
        const cleanPhone = formData.phone.trim().replace(/\s+/g, '')
        if (!/^(\+62|62|0)[0-9]{9,12}$/.test(cleanPhone)) {
          throw new Error('Format nomor telepon tidak valid')
        }
          dataToSend.phone = cleanPhone
        hasChanges = true
      }

      // Alamat
      if (formData.address !== user.address) {
        const cleanAddress = formData.address.trim()
        if (cleanAddress.length < 10) {
          throw new Error('Alamat terlalu pendek, minimal 10 karakter')
        }
        if (cleanAddress.length > 200) {
          throw new Error('Alamat terlalu panjang, maksimal 200 karakter')
        }
        dataToSend.address = cleanAddress
        hasChanges = true
      }

      // Tanggal Lahir
      if (formData.birthDate !== (user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '')) {
        const parsedDate = new Date(formData.birthDate)
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Format tanggal lahir tidak valid')
        }
        const today = new Date()
        const age = today.getFullYear() - parsedDate.getFullYear()
        if (age < 13) {
          throw new Error('Usia minimal 13 tahun')
        }
        if (age > 100) {
          throw new Error('Tanggal lahir tidak valid')
        }
        dataToSend.birthDate = formData.birthDate
        hasChanges = true
      }

      // Jika tidak ada perubahan, tampilkan pesan
      if (!hasChanges) {
        setSuccessMessage('Tidak ada perubahan yang dilakukan')
        setIsSubmitting(false)
        setIsEditing(false)
        return
      }

      console.log('Mengirim data update:', dataToSend)

      // Kirim request ke API
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui profil')
      }

      // Update localStorage dengan data user yang baru
      const updatedUser = { ...user, ...data.user }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      setSuccessMessage('Profil berhasil diperbarui')
      setIsEditing(false)

    } catch (err) {
      console.error('Update profile error:', err)
      setError(err.message || 'Terjadi kesalahan saat memperbarui profil')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTopUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      // Validasi tipe wallet
      const validWalletTypes = ['Rendi Pay', 'Dinda Pay', 'Erwin Pay']
      if (!paymentMethod || !validWalletTypes.includes(paymentMethod)) {
        throw new Error('Tipe wallet tidak valid')
      }

      // Ambil data user dari localStorage untuk verifikasi
      const userData = localStorage.getItem('user')
      if (!userData) {
        throw new Error('Data user tidak ditemukan')
      }

      const parsedUser = JSON.parse(userData)
      if (!parsedUser.id) {
        throw new Error('ID user tidak valid')
      }

      const response = await fetch('/api/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseInt(topUpAmount),
          walletType: paymentMethod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal melakukan top up')
      }

      // Update wallet data
      if (data.wallet) {
        // Perbarui data wallet di state user
        const updatedUser = { ...user }
        const walletIndex = updatedUser.wallets.findIndex(w => w.walletType === data.wallet.type)
        
        if (walletIndex !== -1) {
          updatedUser.wallets[walletIndex] = {
            ...updatedUser.wallets[walletIndex],
            balance: data.wallet.balance,
          }
          
          // Update localStorage dan state
          localStorage.setItem('user', JSON.stringify(updatedUser))
          setUser(updatedUser)
          setSuccessMessage('Top up berhasil')
          setIsTopUpModalOpen(false)
          // Reset form
          setTopUpAmount('')
          setPaymentMethod('')
        }
      } else {
        throw new Error('Data wallet tidak valid dari server')
      }

    } catch (err) {
      console.error('Top up error:', err)
      setError(err.message || 'Terjadi kesalahan saat melakukan top up')
    } finally {
      setIsLoading(false)
    }
  }

  // Tambahkan fungsi untuk menandai notifikasi sudah dibaca
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token tidak ditemukan')
      }

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui notifikasi')
      }

      // Update state notifikasi
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const tabs = [
    {
      id: 'profile',
      label: 'Profil',
      icon: <User className="w-5 h-5" />
    },
    {
      id: 'wallet',
      label: 'Dompet',
      icon: <Wallet className="w-5 h-5" />
    },
    {
      id: 'notifications',
      label: 'Notifikasi',
      icon: <Bell className="w-5 h-5" />
    },
    {
      id: 'playlist',
      label: 'Playlist',
      icon: <Music className="w-5 h-5" />
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: <Settings className="w-5 h-5" />
    }
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Informasi Profil</h2>
              <button
                onClick={toggleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4" />
                )}
                {isEditing ? 'Batal' : 'Edit Profil'}
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded-lg">
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg">
                {error}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                    placeholder="Masukkan nama lengkap"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Alamat
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                <button
                  type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500 to-purple-600 flex items-center justify-center text-white text-xl font-medium border-2 border-white shadow-lg">
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.fullName || user.username}</h3>
                    <p className="text-gray-400">Member sejak {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
                    <Phone className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Nomor Telepon</p>
                      <p className="font-medium">{user.phone || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Alamat</p>
                      <p className="font-medium">{user.address || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm text-gray-400">Tanggal Lahir</p>
                      <p className="font-medium">
                        {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 'wallet':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Dompet Saya</h2>
            <div className="grid gap-4">
              {user.wallets?.map((wallet, index) => (
                <div key={index} className="p-4 bg-black/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{wallet.walletType}</p>
                    <p className="text-xl font-bold">Rp {wallet.balance?.toLocaleString('id-ID')}</p>
                    </div>
                    <button 
                      onClick={() => setIsTopUpModalOpen(true)}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                    Top Up →
                    </button>
                </div>
              ))}
            </div>

            {/* Modal Top Up */}
            {isTopUpModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-gray-900 p-6 rounded-xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Top Up Saldo</h3>
                  
                  {/* Error Message */}
                  {error && (
                    <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {successMessage && (
                    <div className="mb-4 p-3 bg-green-500/10 text-green-500 rounded-lg text-sm">
                      {successMessage}
                    </div>
                  )}

                  <form onSubmit={handleTopUp} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Pilih Nominal Top Up
                      </label>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[10000, 20000, 50000, 100000, 200000, 500000].map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setTopUpAmount(amount.toString())}
                            className={`p-2 text-sm rounded-lg border transition-all ${
                              parseInt(topUpAmount) === amount
                                ? 'border-purple-500 bg-purple-500/20 text-white'
                                : 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                            }`}
                          >
                            Rp {amount.toLocaleString('id-ID')}
                          </button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                        <input
                          type="number"
                          min="10000"
                          step="1000"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="w-full pl-12 pr-4 py-2 bg-black/30 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Nominal Lainnya (Min. 10.000)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Pilih E-Wallet
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['Rendi Pay', 'Dinda Pay', 'Erwin Pay'].map((wallet) => (
                          <button
                            key={wallet}
                            type="button"
                            onClick={() => setPaymentMethod(wallet)}
                            className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                              paymentMethod === wallet
                                ? 'border-purple-500 bg-purple-500/20 text-white'
                                : 'border-gray-700 hover:border-purple-500 hover:bg-purple-500/10'
                            }`}
                          >
                            <Wallet className="w-5 h-5" />
                            <span className="text-sm">{wallet}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Nominal Top Up</span>
                        <span>Rp {parseInt(topUpAmount || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-4">
                        <span className="text-gray-400">Metode Pembayaran</span>
                        <span>{paymentMethod || '-'}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsTopUpModalOpen(false)
                          setTopUpAmount('')
                          setPaymentMethod('')
                          setError('')
                          setSuccessMessage('')
                        }}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !topUpAmount || !paymentMethod}
                        className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isLoading ? 'Memproses...' : 'Top Up Sekarang'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )

      case 'playlist':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Playlist Saya</h2>
            <div className="grid gap-4">
              <div className="p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Music className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Favorit</h3>
                    <p className="text-sm text-gray-400">15 lagu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Notifikasi</h2>
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 rounded-lg text-sm transition-colors
                    ${activeTicketFilter === 'all' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-black/30 text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTicketFilter('all')}
                >
                  Semua
                </button>
                <button
                  className={`px-3 py-1 rounded-lg text-sm transition-colors
                    ${activeTicketFilter === 'unread' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-black/30 text-gray-400 hover:text-white'}`}
                  onClick={() => setActiveTicketFilter('unread')}
                >
                  Belum Dibaca
                </button>
              </div>
            </div>

            {notificationError && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg">
                {notificationError}
              </div>
            )}

            {isLoadingNotifications ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : (
              <div className="space-y-4">
                {notifications
                  .filter(notif => 
                    activeTicketFilter === 'all' ? true : !notif.isRead
                  )
                  .map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 rounded-lg transition-colors cursor-pointer
                        ${notification.isRead 
                          ? 'bg-black/30' 
                          : 'bg-purple-500/10 hover:bg-purple-500/20'}`}
                      onClick={() => !notification.isRead && markAsRead(notification.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          {notification.type === 'TICKET_PURCHASED' && (
                            <Ticket className="w-5 h-5 text-purple-400" />
                          )}
                          {notification.type === 'TICKET_SOLD' && (
                            <Ticket className="w-5 h-5 text-green-400" />
                          )}
                          {notification.type === 'WALLET_TOPUP' && (
                            <Wallet className="w-5 h-5 text-blue-400" />
                          )}
                          {notification.type === 'EVENT_CREATED' && (
                            <Music className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{notification.title}</h3>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                {notifications.length === 0 && !isLoadingNotifications && (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">Belum ada notifikasi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-xl font-bold mb-6">Pengaturan</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-400" />
                  <span>Notifikasi Email</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                </label>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-8 pb-4">
          {tabs.map(tab => (
            <a
              key={tab.id}
              href={`/profile?tab=${tab.id}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </a>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
} 