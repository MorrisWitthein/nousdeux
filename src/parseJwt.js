export function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export function getCurrentUser() {
  const token = localStorage.getItem('token')
  if (!token) return null
  const payload = parseJwt(token)
  return payload?.sub || null
}
