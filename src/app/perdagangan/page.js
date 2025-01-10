'use client'

import { Ticket, Calendar, Clock, Wallet, Send, Check } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

export default function Perdagangan() {
  const [tradeType, setTradeType] = useState('buy');
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [sendingTicketId, setSendingTicketId] = useState(null);

  const fetchTickets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(`/api/transactions?type=${tradeType}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data tiket');
      }

      setTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [tradeType]);

  const handleSendTicket = async (ticketId) => {
    try {
      setIsSending(true);
      setSendingTicketId(ticketId);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const response = await fetch(`/api/ticket/send/${ticketId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengirim tiket');
      }

      // Refresh data tiket
      fetchTickets();
      alert('Tiket berhasil dikirim!');

    } catch (error) {
      console.error('Error sending ticket:', error);
      alert(error.message);
    } finally {
      setIsSending(false);
      setSendingTicketId(null);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Ticket className="w-5 h-5 text-purple-500" />
        <h1 className="text-xl font-semibold">Perdagangan Tiket</h1>
      </div>

      {/* Toggle Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTradeType('buy')}
          className={`flex-1 py-2 px-4 text-sm rounded-lg transition-colors ${
            tradeType === 'buy'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pembelian Tiket
        </button>
        <button
          onClick={() => setTradeType('sell')}
          className={`flex-1 py-2 px-4 text-sm rounded-lg transition-colors ${
            tradeType === 'sell'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Penjualan Tiket
        </button>
      </div>

      {/* Content based on trade type */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Memuat data tiket...
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Belum ada {tradeType === 'buy' ? 'pembelian' : 'penjualan'} tiket
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-sm">{ticket.eventName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Wallet className="w-3 h-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {ticket.walletType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-purple-600 text-sm font-medium block">
                    Rp {parseInt(ticket.amount).toLocaleString('id-ID')}
                  </span>
                  <div className="flex items-center gap-1 justify-end">
                    <span className={`text-xs ${
                      ticket.status === 'active' ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {ticket.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                    {tradeType === 'sell' && ticket.isSent && (
                      <div className="flex items-center gap-1 text-xs text-green-500">
                        <Check className="w-3 h-3" />
                        <span>Terkirim</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Event: {new Date(ticket.eventDate).toLocaleDateString('id-ID')}</span>
                  <Clock className="w-3 h-3 ml-2" />
                  <span>Dibeli: {new Date(ticket.createdAt).toLocaleDateString('id-ID')}</span>
                  {ticket.sentAt && (
                    <>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>Dikirim: {new Date(ticket.sentAt).toLocaleDateString('id-ID')}</span>
                    </>
                  )}
                </div>
                {tradeType === 'sell' && ticket.status === 'active' && !ticket.isSent && (
                  <button
                    onClick={() => handleSendTicket(ticket.id)}
                    disabled={isSending}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg transition-colors ${
                      isSending && sendingTicketId === ticket.id
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                    }`}
                  >
                    <Send className="w-3 h-3" />
                    {isSending && sendingTicketId === ticket.id ? 'Mengirim...' : 'Kirim Tiket'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 