import Swal from 'sweetalert2'

const typeConfig = {
  success: {
    iconColor: '#16a34a',
    confirmColor: '#16a34a',
    titleColor: '#14532d',
    borderTop: '5px solid #16a34a',
  },
  error: {
    iconColor: '#dc2626',
    confirmColor: '#dc2626',
    titleColor: '#7f1d1d',
    borderTop: '5px solid #dc2626',
  },
  warning: {
    iconColor: '#d97706',
    confirmColor: '#d97706',
    titleColor: '#78350f',
    borderTop: '5px solid #d97706',
  },
  info: {
    iconColor: '#2563eb',
    confirmColor: '#2563eb',
    titleColor: '#1e3a8a',
    borderTop: '5px solid #2563eb',
  },
}

export const showPopup = (message, type = 'info') => {
  if (!message) return

  const cfg = typeConfig[type] || typeConfig.info

  Swal.fire({
    icon: type,
    title: type.charAt(0).toUpperCase() + type.slice(1),
    text: message,
    confirmButtonText: 'OK',
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: true,
    allowOutsideClick: true,
    background: '#ffffff',
    color: '#1e293b',
    iconColor: cfg.iconColor,
    confirmButtonColor: cfg.confirmColor,
    width: '34rem',
    padding: '2.5rem 2rem',
    backdrop: 'rgba(4, 8, 28, 0.82)',
    customClass: {
      popup: 'swal-hub-popup',
      title: 'swal-hub-title',
      confirmButton: 'swal-hub-btn',
    },
    didOpen: (popup) => {
      popup.style.borderRadius = '1.25rem'
      popup.style.borderTop = cfg.borderTop
      popup.style.boxShadow = '0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08)'

      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = cfg.titleColor
        title.style.fontWeight = '700'
        title.style.fontSize = '1.5rem'
      }
    },
  })
}

export const showConfirm = async ({
  title,
  text,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  icon = 'warning',
} = {}) => {
  const cfg = typeConfig[icon] || typeConfig.warning

  const result = await Swal.fire({
    title: title || 'Are you sure?',
    text: text || '',
    icon,
    iconColor: cfg.iconColor,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: cfg.confirmColor,
    cancelButtonColor: '#64748b',
    background: '#ffffff',
    color: '#1e293b',
    width: '34rem',
    padding: '2.5rem 2rem',
    backdrop: 'rgba(4, 8, 28, 0.82)',
    customClass: {
      popup: 'swal-hub-popup',
      title: 'swal-hub-title',
      confirmButton: 'swal-hub-btn',
    },
    didOpen: (popup) => {
      popup.style.borderRadius = '1.25rem'
      popup.style.borderTop = cfg.borderTop
      popup.style.boxShadow = '0 32px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.08)'

      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = cfg.titleColor
        title.style.fontWeight = '700'
        title.style.fontSize = '1.5rem'
      }
    },
  })
  return result.isConfirmed
}
