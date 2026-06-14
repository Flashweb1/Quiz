// Anti-cheat enforcement: tab switching, fullscreen, right-click, copy/paste

export function setupAntiCheat(onViolation, options = {}) {
  const {
    maxTabSwitches = 3,
    autoSubmitAfterMax = true,
    onAutoSubmit = null,
  } = options

  let tabSwitchCount = 0
  let isActive = false
  let fullscreenExits = 0
  let rightClicks = 0
  let copyPasteEvents = 0

  function handleVisibilityChange() {
    if (!isActive) return
    if (document.visibilityState === 'hidden') {
      tabSwitchCount++
      onViolation('TAB_SWITCH', `Tab switch #${tabSwitchCount}`)
      if (tabSwitchCount >= maxTabSwitches && autoSubmitAfterMax) {
        if (onAutoSubmit) onAutoSubmit('Too many tab switches')
      }
    }
  }

  function handleFullscreenChange() {
    if (!isActive) return
    if (!document.fullscreenElement) {
      fullscreenExits++
      onViolation('FULLSCREEN_EXIT', `Fullscreen exit #${fullscreenExits}`)
    }
  }

  function handleContextMenu(e) {
    if (!isActive) return
    e.preventDefault()
    rightClicks++
    onViolation('RIGHT_CLICK', `Right click #${rightClicks}`)
  }

  function handleCopy(e) {
    if (!isActive) return
    e.preventDefault()
    copyPasteEvents++
    onViolation('COPY_PASTE', `Copy attempt #${copyPasteEvents}`)
  }

  function handlePaste(e) {
    if (!isActive) return
    e.preventDefault()
    copyPasteEvents++
    onViolation('COPY_PASTE', `Paste attempt #${copyPasteEvents}`)
  }

  function handleKeyDown(e) {
    if (!isActive) return
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
      (e.ctrlKey && e.key === 'U')
    ) {
      e.preventDefault()
      onViolation('SUSPICIOUS_PATTERN', 'Dev tools attempt')
    }
  }

  function start() {
    isActive = true
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('keydown', handleKeyDown)
  }

  function stop() {
    isActive = false
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.removeEventListener('contextmenu', handleContextMenu)
    document.removeEventListener('copy', handleCopy)
    document.removeEventListener('paste', handlePaste)
    document.removeEventListener('keydown', handleKeyDown)
  }

  function requestFullscreen() {
    const el = document.documentElement
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {})
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen()
    }
  }

  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {})
    }
  }

  function getStats() {
    return { tabSwitchCount, fullscreenExits, rightClicks, copyPasteEvents }
  }

  return { start, stop, requestFullscreen, exitFullscreen, getStats }
}
