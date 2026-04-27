'use client'

import { useState } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const whatsappNumber = "201553575236" 

  const handleOrder = () => {
    setLoading(true)
    const message = encodeURIComponent("أهلاً، أريد الاستفسار عن خدماتكم")
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#111',
      color: 'white',
      fontFamily: 'sans-serif',
      direction: 'rtl',
      margin: 0,
      padding: 0
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '10px', color: '#4ade80' }}>صفحة المنتج</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#ccc' }}>اشتري الآن واحصل على العرض!</p>
      
      <button 
        onClick={handleOrder}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '15px 35px',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: 'white',
          backgroundColor: loading ? '#666' : '#25D366',
          border: 'none',
          borderRadius: '50px',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M.057 24l1.687-6.162c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.56 5.338-11.892 11.901-11.892 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.414 0 6.561-5.338 11.892-11.901 11.892-1.997 0-3.951-.5-5.688-1.448l-6.306 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.591 5.468 0 9.911-4.439 9.911-9.904 0-2.652-1.022-5.14-2.871-6.989-1.848-1.847-4.335-4.335-2.87-6.989-2.87-5.466 0-9.91 4.439-9.91 9.903 0 2.26.661 4.012 1.921 6.07l-1.092 3.993 4.139-1.083z"/>
        </svg>
        {loading ? 'جاري التحميل...' : 'اطلب الآن عبر واتساب'}
      </button>
    </div>
  )
}