import Swal from 'sweetalert2'
import './popup.css'

const typeConfig = {
  success: {
    iconColor: '#10b981',
    confirmColor: '#10b981',
    titleColorDark: '#d1fae5',
    titleColorLight: '#047857',
  },
  error: {
    iconColor: '#ef4444',
    confirmColor: '#ef4444',
    titleColorDark: '#fee2e2',
    titleColorLight: '#b91c1c',
  },
  warning: {
    iconColor: '#f59e0b',
    confirmColor: '#f59e0b',
    titleColorDark: '#fef3c7',
    titleColorLight: '#92400e',
  },
  info: {
    iconColor: '#3b82f6',
    confirmColor: '#3b82f6',
    titleColorDark: '#dbeafe',
    titleColorLight: '#1d4ed8',
  },
}

const isLightTheme = () => document.documentElement.getAttribute('data-theme') === 'light'

const getThemePalette = (lightMode) => {
  if (lightMode) {
    return {
      background: '#e3ecf6',
      textColor: '#111827',
      backdrop: 'rgba(107, 114, 128, 0.35)',
      cancelColor: '#6b7280',
      variantClass: 'swal-hub-light',
    }
  }

  return {
    background: 'rgba(10, 11, 34, 0.96)',
    textColor: '#e7eaff',
    backdrop: 'rgba(4, 8, 28, 0.82)',
    cancelColor: '#334155',
    variantClass: 'swal-hub-dark',
  }
}

const isPopupType = (value) => typeof value === 'string' && Boolean(typeConfig[value])

const resolvePopupArgs = (arg1, arg2, arg3) => {
  // Format A: showPopup(type, title, message)
  // Format B: showPopup(title, message, type)
  if (arg3 !== undefined) {
    const arg1IsType = isPopupType(arg1)
    const arg3IsType = isPopupType(arg3)

    if (arg1IsType && !arg3IsType) {
      const type = arg1
      return {
        type,
        title: String(arg2 || type.charAt(0).toUpperCase() + type.slice(1)),
        message: String(arg3 || ''),
      }
    }

    if (!arg1IsType && arg3IsType) {
      const type = arg3
      return {
        type,
        title: String(arg1 || type.charAt(0).toUpperCase() + type.slice(1)),
        message: String(arg2 || ''),
      }
    }

    const type = arg1IsType ? arg1 : 'info'
    return {
      type,
      title: String(arg1IsType ? arg2 || type.charAt(0).toUpperCase() + type.slice(1) : arg1 || 'Info'),
      message: String(arg1IsType ? arg3 || '' : arg2 || ''),
    }
  }

  // Legacy format: showPopup(message, type)
  if (arg2 !== undefined && isPopupType(arg2)) {
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
  const lightMode = isLightTheme()
  const themePalette = getThemePalette(lightMode)
  const titleColor = lightMode ? cfg.titleColorLight : cfg.titleColorDark

  Swal.fire({
    icon: type,
    title,
    text: message,
    confirmButtonText: 'OK',
    timer: 4000,
    timerProgressBar: true,
    showConfirmButton: true,
    allowOutsideClick: true,
    background: themePalette.background,
    color: themePalette.textColor,
    iconColor: cfg.iconColor,
    confirmButtonColor: cfg.confirmColor,
    width: '32rem',
    padding: '2rem 1.75rem',
    backdrop: themePalette.backdrop,
    customClass: {
      popup: `swal-hub-popup swal-hub-${type} ${themePalette.variantClass}`,
      title: 'swal-hub-title',
      htmlContainer: 'swal-hub-text',
      icon: 'swal-hub-icon',
      confirmButton: 'swal-hub-btn',
      timerProgressBar: 'swal-hub-timer',
    },
    didOpen: (popup) => {
      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = titleColor
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
  const lightMode = isLightTheme()
  const themePalette = getThemePalette(lightMode)
  const titleColor = lightMode ? cfg.titleColorLight : cfg.titleColorDark

  const result = await Swal.fire({
    title: title || 'Are you sure?',
    text: text || '',
    icon,
    iconColor: cfg.iconColor,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: cfg.confirmColor,
    cancelButtonColor: themePalette.cancelColor,
    background: themePalette.background,
    color: themePalette.textColor,
    width: '32rem',
    padding: '2rem 1.75rem',
    backdrop: themePalette.backdrop,
    customClass: {
      popup: `swal-hub-popup swal-hub-${icon} ${themePalette.variantClass}`,
      title: 'swal-hub-title',
      htmlContainer: 'swal-hub-text',
      icon: 'swal-hub-icon',
      confirmButton: 'swal-hub-btn',
      cancelButton: 'swal-hub-cancel',
    },
    didOpen: (popup) => {
      const title = popup.querySelector('.swal-hub-title')
      if (title) {
        title.style.color = titleColor
        title.style.fontWeight = '700'
        title.style.fontSize = '1.35rem'
      }
    },
  })
  return result.isConfirmed
}
