const handlePurchase = async () => {
    if (!selectedWallet) {
      alert('Silakan pilih metode pembayaran')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          eventId: parseInt(params.id),
          walletType: selectedWallet
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membeli tiket')
      }

      setSuccessMessage('Tiket berhasil dibeli!')
      
      // Update wallet balance in localStorage
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        const updatedWallets = user.wallets.map(wallet => {
          if (wallet.walletType === selectedWallet) {
            return {
              ...wallet,
              balance: data.data.wallet.balance
            }
          }
          return wallet
        })
        
        const updatedUser = {
          ...user,
          wallets: updatedWallets
        }
        
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setWallets(updatedWallets)
      }

      // Update event data
      setEvent(prev => ({
        ...prev,
        ticketQuantity: data.data.event.ticketQuantity
      }))

      // Redirect ke halaman tiket setelah berhasil
      setTimeout(() => {
        router.push('/profile?tab=tickets')
      }, 2000)

    } catch (error) {
      console.error('Error purchasing ticket:', error)
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  } 