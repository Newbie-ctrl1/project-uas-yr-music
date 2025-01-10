'use client'

import { User, Mail, Crown, Bell, Wallet } from 'lucide-react'
import { useState } from 'react'

export default function TabProfile() {
  const [activeTab, setActiveTab] = useState('profile');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <User className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Nama Lengkap</p>
                <p className="font-medium">Yusril Rapsanjani</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Surel</p>
                <p className="font-medium">premium@yrmusic.com</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Crown className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Keanggotaan</p>
                <p className="font-medium">Premium (1 Tahun)</p>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-4">
            {/* Notifikasi Terbaru */}
            <div className="p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Pembaruan Sistem</p>
                  <p className="text-xs text-gray-500 mt-1">Kami telah memperbarui sistem pembayaran untuk pengalaman yang lebih baik</p>
                  <p className="text-xs text-gray-400 mt-2">2 jam yang lalu</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Konser Baru Ditambahkan</p>
                  <p className="text-xs text-gray-500 mt-1">Tiket konser Tulus sudah tersedia untuk dibeli</p>
                  <p className="text-xs text-gray-400 mt-2">5 jam yang lalu</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Promo Spesial</p>
                  <p className="text-xs text-gray-500 mt-1">Dapatkan diskon 20% untuk pembelian tiket hari ini</p>
                  <p className="text-xs text-gray-400 mt-2">1 hari yang lalu</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* Rendi Pay */}
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-sm font-medium">Rendi Pay</h3>
                </div>
                <p className="text-lg font-bold mb-3">Rp 250.000</p>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Top Up
                  </button>
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Transfer
                  </button>
                </div>
              </div>

              {/* Dinda Pay */}
              <div className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-sm font-medium">Dinda Pay</h3>
                </div>
                <p className="text-lg font-bold mb-3">Rp 175.000</p>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Top Up
                  </button>
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Transfer
                  </button>
                </div>
              </div>

              {/* Erwin Pay */}
              <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-4 h-4" />
                  <h3 className="text-sm font-medium">Erwin Pay</h3>
                </div>
                <p className="text-lg font-bold mb-3">Rp 320.000</p>
                <div className="flex gap-2 text-xs">
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Top Up
                  </button>
                  <button className="px-3 py-1.5 bg-white/20 rounded-md hover:bg-white/30 transition-colors">
                    Transfer
                  </button>
                </div>
              </div>
            </div>

            {/* Total Balance */}
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <span className="text-gray-500">Total Saldo</span>
                <p className="font-bold text-gray-900">Rp 745.000</p>
              </div>
              <button className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors">
                Riwayat
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`px-6 py-2 rounded-lg transition-colors ${
            activeTab === 'profile' 
              ? 'bg-purple-100 text-purple-600' 
              : 'hover:bg-purple-50 text-gray-600'
          }`}
        >
          Profil
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`px-6 py-2 rounded-lg transition-colors ${
            activeTab === 'notifications' 
              ? 'bg-purple-100 text-purple-600' 
              : 'hover:bg-purple-50 text-gray-600'
          }`}
        >
          Notifikasi
        </button>
        <button 
          onClick={() => setActiveTab('wallet')}
          className={`px-6 py-2 rounded-lg transition-colors ${
            activeTab === 'wallet' 
              ? 'bg-purple-100 text-purple-600' 
              : 'hover:bg-purple-50 text-gray-600'
          }`}
        >
          Dompet
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {renderTabContent()}
      </div>
    </div>
  );
} 