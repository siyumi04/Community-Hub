export const showPopup = (message, type = 'info') => {
  if (!message) return

  window.dispatchEvent(
    new CustomEvent('app-popup', {
      detail: {
        message,
        type,
      },
    }),
  )
}
