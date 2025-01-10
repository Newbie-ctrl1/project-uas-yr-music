'use client'

import { MessageCircle, X, Smile, Send } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

// Konstanta untuk context AI
const AI_CONTEXT = `
Anda adalah asisten AI untuk YR Music, sebuah platform streaming musik.
Informasi tentang YR Music:
- Menyediakan streaming musik berkualitas tinggi
- Memiliki fitur playlist dan rekomendasi musik
- Mengadakan event musik dan konser
- Menawarkan tiket konser
- Memiliki sistem wallet untuk pembayaran (Rendi Pay, Dinda Pay, Erwin Pay)
- Jam operasional customer service: 09.00 - 17.00 WIB

Anda harus:
- Menjawab pertanyaan seputar musik dan YR Music dengan ramah
- Membantu masalah teknis terkait platform
- Memberikan rekomendasi musik
- Menjelaskan cara penggunaan fitur
- Menginformasikan event yang sedang berlangsung
- Membantu masalah pembayaran

Jawablah dengan singkat, informal dan ramah.
`

export default function FloatingCS() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'admin',
      message: 'Hai! Saya asisten AI YR Music, ada yang bisa saya bantu? 👋',
      timestamp: new Date().toLocaleTimeString()
    }
  ])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState(null)
  const chatEndRef = useRef(null)

  // Auto scroll ke pesan terbaru
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      scrollToBottom()
    }
  }, [isOpen, chatHistory])

  // Fungsi untuk mendapatkan respons dari Groq AI
  const getAIResponse = async (userMessage) => {
    try {
      setError(null)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatHistory.map(chat => `${chat.type === 'user' ? 'User' : 'Assistant'}: ${chat.message}`).join('\n'),
          context: AI_CONTEXT,
          userMessage
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'AI response error')
      }
      
      const data = await response.json()
      return data.response
    } catch (error) {
      console.error('Error getting AI response:', error)
      setError(error.message)
      return 'Maaf, saya sedang mengalami gangguan. Silakan coba lagi nanti.'
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return

    const userMessage = message.trim()
    setMessage('')
    setIsTyping(true)
    setError(null)

    // Tambah pesan user
    setChatHistory(prev => [...prev, {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date().toLocaleTimeString()
    }])

    try {
      // Dapatkan respons dari AI
      const aiResponse = await getAIResponse(userMessage)
      
      // Tambah respons AI ke chat history
      setChatHistory(prev => [...prev, {
        id: Date.now() + 1,
        type: 'admin',
        message: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (err) {
      setError(err.message)
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[99999]">
      {isOpen ? (
        <div className="bg-white rounded-xl shadow-2xl p-4 mb-4 w-80 animate-fade-in border border-purple-100">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <h3 className="font-medium text-purple-900">YR Music AI Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat History */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
            {chatHistory.map((chat) => (
              <div 
                key={chat.id}
                className={`flex ${chat.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`p-3 rounded-lg max-w-[80%] break-words ${
                    chat.type === 'user' 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-50 text-purple-900'
                  }`}
                >
                  <p className="text-sm">{chat.message}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {chat.timestamp}
                  </span>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-purple-50 text-purple-900 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs">
                  Error: {error}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tanyakan sesuatu..."
                rows="1"
                disabled={isTyping}
                className="w-full px-4 py-2.5 text-sm border border-purple-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 pr-10 text-gray-900 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => setMessage(prev => prev + ' 😊')}
                disabled={isTyping}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
              className="px-4 py-2.5 bg-purple-600 text-white text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-xs text-gray-500 justify-center mt-4">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            AI Assistant Online 24/7
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 text-white p-4 rounded-full shadow-xl hover:bg-purple-700 transition-all hover:scale-110 animate-bounce-slow relative"
        >
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-xs">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      <style jsx>{`
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* Custom Scrollbar */
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #E9D5FF;
          border-radius: 20px;
        }
      `}</style>
    </div>
  )
} 