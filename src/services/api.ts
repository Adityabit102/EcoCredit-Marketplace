const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api'

// Access token lives in memory + localStorage; the refresh token is an httpOnly
// cookie the browser sends automatically (credentials: 'include').
const getHeaders = () => {
  const token = localStorage.getItem('ecocredit_access_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function refreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem('ecocredit_access_token', data.accessToken)
      return true
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const doFetch = () => fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: { ...getHeaders(), ...options.headers },
  })

  let response = await doFetch()

  if (response.status === 401 && !url.includes('/auth/')) {
    const ok = await refreshToken()
    if (ok) {
      response = await doFetch()
    } else {
      localStorage.removeItem('ecocredit_access_token')
      window.dispatchEvent(new Event('auth_expired'))
      throw new Error('Session expired. Please log in again.')
    }
  }

  // some endpoints (certificate download) return non-JSON
  const ct = response.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    if (!response.ok) throw new Error('Request failed')
    return response
  }

  const data = await response.json()
  if (!response.ok) {
    // surface field-level validation details (e.g. "Password must be at least 8 characters")
    const detail = Array.isArray(data.details) ? data.details.map((d: any) => d.message || d).join(', ') : ''
    throw new Error(detail || data.error || 'API Request Failed')
  }
  return data
}

const qs = (params?: Record<string, any>) =>
  params && Object.keys(params).length
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '') as any).toString()
    : ''

export const api = {
  auth: {
    login: (c: any) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(c) }),
    register: (d: any) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    me: () => fetchWithAuth('/auth/me'),
    logout: () => fetchWithAuth('/auth/logout', { method: 'POST' }),
    forgotPassword: (email: string) => fetchWithAuth('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (d: any) => fetchWithAuth('/auth/reset-password', { method: 'POST', body: JSON.stringify(d) }),
  },
  ai: {
    chat: (messages: any[]) => fetchWithAuth('/ai/chat', { method: 'POST', body: JSON.stringify({ messages }) }),
    classify: (imageUrl: string) => fetchWithAuth('/ai/classify', { method: 'POST', body: JSON.stringify({ imageUrl }) }),
  },
  actions: {
    list: (params?: any) => fetchWithAuth(`/actions${qs(params)}`),
    get: (id: string) => fetchWithAuth(`/actions/${id}`),
    create: (d: any) => fetchWithAuth('/actions', { method: 'POST', body: JSON.stringify(d) }),
    updateBlockchain: (id: string, hash: string) => fetchWithAuth(`/actions/${id}/blockchain`, { method: 'PATCH', body: JSON.stringify({ blockchainHash: hash }) }),
  },
  listings: {
    list: (params?: any) => fetchWithAuth(`/listings${qs(params)}`),
    get: (id: string) => fetchWithAuth(`/listings/${id}`),
    create: (d: any) => fetchWithAuth('/listings', { method: 'POST', body: JSON.stringify(d) }),
    remove: (id: string) => fetchWithAuth(`/listings/${id}`, { method: 'DELETE' }),
  },
  transactions: {
    list: (params?: any) => fetchWithAuth(`/transactions${qs(params)}`),
    purchase: (d: any) => fetchWithAuth('/transactions/purchase', { method: 'POST', body: JSON.stringify(d) }),
    retire: (credits: number) => fetchWithAuth('/transactions/retire', { method: 'POST', body: JSON.stringify({ credits }) }),
    proof: (proofId: string) => fetchWithAuth(`/transactions/proof/${proofId}`),
  },
  users: {
    dashboard: () => fetchWithAuth('/users/dashboard'),
    updateWallet: (d: any) => fetchWithAuth('/users/wallet', { method: 'PATCH', body: JSON.stringify(d) }),
    updateProfile: (d: any) => fetchWithAuth('/users/profile', { method: 'PATCH', body: JSON.stringify(d) }),
    publicProfile: (id: string) => fetchWithAuth(`/users/${id}/profile`),
  },
  notifications: {
    list: (params?: any) => fetchWithAuth(`/notifications${qs(params)}`),
    markRead: (id: string) => fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => fetchWithAuth('/notifications/read-all', { method: 'POST' }),
  },
  reviews: {
    create: (d: any) => fetchWithAuth('/reviews', { method: 'POST', body: JSON.stringify(d) }),
    forSeller: (id: string) => fetchWithAuth(`/reviews/seller/${id}`),
  },
  favorites: {
    list: () => fetchWithAuth('/favorites'),
    add: (d: any) => fetchWithAuth('/favorites', { method: 'POST', body: JSON.stringify(d) }),
    remove: (listingId: string) => fetchWithAuth(`/favorites/${listingId}`, { method: 'DELETE' }),
  },
  leaderboard: {
    top: (params?: any) => fetchWithAuth(`/leaderboard${qs(params)}`),
    badges: () => fetchWithAuth('/leaderboard/badges'),
    myRank: (params?: any) => fetchWithAuth(`/leaderboard/me${qs(params)}`),
  },
  certificates: {
    downloadUrl: () => `${API_URL}/certificates/download`,
  },
  payments: {
    status: () => fetchWithAuth('/payments/status'),
    checkout: (plan: string) => fetchWithAuth('/payments/checkout', { method: 'POST', body: JSON.stringify({ plan }) }),
    subscribe: (tonsPerMonth: number) => fetchWithAuth('/payments/subscribe', { method: 'POST', body: JSON.stringify({ tonsPerMonth }) }),
  },
  admin: {
    stats: () => fetchWithAuth('/admin/stats'),
    analytics: (params?: any) => fetchWithAuth(`/admin/analytics${qs(params)}`),
    users: (params?: any) => fetchWithAuth(`/admin/users${qs(params)}`),
    pendingActions: () => fetchWithAuth('/admin/actions/pending'),
    updatePlan: (id: string, plan: string) => fetchWithAuth(`/admin/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) }),
    updateActionStatus: (id: string, status: string) => fetchWithAuth(`/admin/actions/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },
}
