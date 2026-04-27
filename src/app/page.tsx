'use client'

import { useState } from 'react'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const whatsappNumber = "201553575236" 

  const handleOrder = () => {
    setLoading(true)
    const message = encodeURIComponent("أهلاً، أريد الاستفسار عن خدماتكم")
    // التحويل بيحصل هنا فقط لما المستخدم يدوس على الزرار
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank')
    
    setTimeout(() => {
      setLoading(false)
    }, 2000)
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
      <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#ccc' }}>استمتع بتجربة لوحة التحكم الجديدة</p>
      
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
        {loading ? 'جاري التحميل...' : 'تواصل معنا عبر واتساب'}
      </button>

      <div style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem' }}>
        جاري مراجعة تحديثات واجهة المستخدم...
      </div>
    </div>
  )
}