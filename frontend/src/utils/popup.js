import Swal from 'sweetalert2'
import './popup.css'

const typeConfig = {
  success: {
    iconColor: '#22c55e',
    confirmColor: '#22c55e',
    titleColor: '#dcfce7',
  },
  error: {
    iconColor: '#f43f5e',
    confirmColor: '#f43f5e',
    titleColor: '#ffe4e6',
  },
  warning: {
    iconColor: '#f59e0b',
    confirmColor: '#f59e0b',
    titleColor: '#fef3c7',
  },
  info: {
    iconColor: '#60a5fa',
    confirmColor: '#4f46e5',
    titleColor: '#dbeafe',
  },
}

const resolvePopupArgs = (arg1, arg2, arg3) => {
  // New format: showPopup(type, title, message)
  if (arg3 !== undefined) {
    const type = typeof arg1 === 'string' && typeConfig[arg1] ? arg1 : 'info'
    return {
      type,
      title: String(arg2 || type.charAt(0).toUpperCase() + type.slice(1)),
      message: String(arg3 || ''),
    }
  }

  // Legacy format: showPopup(message, type)
  if (arg2 !== undefined && typeof arg2 === 'string' && typeConfig[arg2]) {
    const type = arg2
    return {
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: String(arg1 || ''),
    }
  }

  return {
    type: 'info',
    title: 'Info',
    message: String(arg1 || ''),
  }
}

export const showPopup = (arg1, arg2, arg3) => {
  const { type, title, message } = resolvePopupArgs(arg1, arg2, arg3)

  if (!message) return

  const cfg = typeConfig[type] || typeConfig.info

  Swal.fire({
    icon: type,
    title,
    text: message,
    confirmButtonText: 'OK',
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: true,
    allowOutsideClick: true,
    background: 'rgba(10, 11, 34, 0.96)',
    color: '#e7eaff',
    iconColor: cfg.iconColor,
    confirmButtonColor: cfg.confirmColor,
    width: '32rem',
    padding: '2rem 1.75rem',
    backdrop: 'rgba(4, 8, 28, 0.82)',
    customClass: {
      popup: `swal-hub-popup swal-hub-${type}`,
      title: 'swal-hub-title',
      htmlContainer: 'swal-hub-text',
      icon: 'swal-hub-icon',
      confirmButton: 'swal-hub-btn',
      timerProgressBar: 'swal-hub-timer',
    },
    didOpen: (popup) => {
      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = cfg.titleColor
        title.style.fontWeight = '700'
        title.style.fontSize = '1.35rem'
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
    cancelButtonColor: '#334155',
    background: 'rgba(10, 11, 34, 0.96)',
    color: '#e7eaff',
    width: '32rem',
    padding: '2rem 1.75rem',
    backdrop: 'rgba(4, 8, 28, 0.82)',
    customClass: {
      popup: `swal-hub-popup swal-hub-${icon}`,
      title: 'swal-hub-title',
      htmlContainer: 'swal-hub-text',
      icon: 'swal-hub-icon',
      confirmButton: 'swal-hub-btn',
      cancelButton: 'swal-hub-cancel',
    },
    didOpen: (popup) => {
      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = cfg.titleColor
        title.style.fontWeight = '700'
        title.style.fontSize = '1.35rem'
      }
    },
  })
  return result.isConfirmed
}
