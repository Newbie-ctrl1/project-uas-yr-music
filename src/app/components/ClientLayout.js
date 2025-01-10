'use client'

import Sidebar from './Sidebar'
import FloatingCS from './FloatingCS'

export default function ClientLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-16">
        {children}
      </div>
      <FloatingCS />
    </div>
  )
} 