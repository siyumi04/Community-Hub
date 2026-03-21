import { useEffect, useState } from 'react'
import './PopupMessage.css'

function PopupMessage() {
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const onPopup = (event) => {
      const detail = event.detail || {}
      const text = String(detail.message || '').trim()
      const type = detail.type || 'info'

      if (!text) return

      const id = `${Date.now()}-${Math.random()}`
      setMessages((prev) => [...prev, { id, text, type }])

      window.setTimeout(() => {
        setMessages((prev) => prev.filter((item) => item.id !== id))
      }, 3200)
    }

    window.addEventListener('app-popup', onPopup)
    return () => window.removeEventListener('app-popup', onPopup)
  }, [])

  const dismissMessage = (id) => {
    setMessages((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="popup-container" aria-live="polite" aria-atomic="true">
      {messages.map((message) => (
        <div key={message.id} className={`popup-toast ${message.type}`}>
          <p>{message.text}</p>
          <button
            type="button"
            className="popup-close"
            onClick={() => dismissMessage(message.id)}
            aria-label="Dismiss notification"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}

export default PopupMessage
