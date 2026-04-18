/**
 * Opens an SSE connection and handles iOS reconnection.
 *
 * iOS Safari (standalone PWA) kills SSE connections on background/lock.
 * It does not reliably reconnect. This utility:
 *   - reconnects on error (after 3 s)
 *   - refreshes + reconnects when the page becomes visible again
 *
 * Returns a cleanup function for use in useEffect.
 */
export function connectStream(url, onMessage) {
  let es = null
  let reconnectTimer = null

  function connect() {
    if (es) { es.close(); es = null }
    es = new EventSource(url)
    es.onmessage = onMessage
    es.onerror = () => {
      es.close()
      es = null
      reconnectTimer = setTimeout(connect, 3000)
    }
  }

  function onVisible() {
    if (document.visibilityState === 'visible') {
      onMessage()
      if (!es || es.readyState === EventSource.CLOSED) connect()
    }
  }

  connect()
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    clearTimeout(reconnectTimer)
    if (es) es.close()
    document.removeEventListener('visibilitychange', onVisible)
  }
}
