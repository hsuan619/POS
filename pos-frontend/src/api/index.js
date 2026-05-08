import axios from 'axios'

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' })

const TOKEN_KEY = 'pos_token'
export const getToken  = ()      => localStorage.getItem(TOKEN_KEY)
export const setToken  = (t)     => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = ()     => localStorage.removeItem(TOKEN_KEY)

http.interceptors.request.use(cfg => {
  const t = getToken()
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

http.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) clearToken()
    return Promise.reject(err)
  }
)

export async function login(password) {
  const { data } = await http.post('/auth/login', { password })
  setToken(data.token)
}

// ── 正規化：讓後端格式符合前端元件期望的欄位名 ──────────────────
function normalizeProduct(p) {
  return { ...p, id: p._id }
}

function localDateStr(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function normalizeOrder(o) {
  return {
    ...o,
    id:   o.orderNo,
    ts:   o.createdAt,
    date: localDateStr(o.createdAt),
  }
}

// ── Products ─────────────────────────────────────────────────────────
export async function fetchProducts(params) {
  const { data } = await http.get('/products', { params })
  return data.map(normalizeProduct)
}

export async function createProduct(payload) {
  const { data } = await http.post('/products', payload)
  return normalizeProduct(data)
}

export async function updateProduct(id, payload) {
  const { data } = await http.put(`/products/${id}`, payload)
  return normalizeProduct(data)
}

export async function deleteProduct(id) {
  await http.delete(`/products/${id}`)
}

// ── Purchases ────────────────────────────────────────────────────────
export async function fetchPurchases(params) {
  const { data } = await http.get('/purchases', { params })
  return data
}

export async function createPurchase(payload) {
  const { data } = await http.post('/purchases', payload)
  return data
}

export async function updatePurchase(id, payload) {
  const { data } = await http.put(`/purchases/${id}`, payload)
  return data
}

export async function deletePurchase(id) {
  await http.delete(`/purchases/${id}`)
}

// ── Expenses ─────────────────────────────────────────────────────────
export async function fetchExpenses(params) {
  const { data } = await http.get('/expenses', { params })
  return data
}

export async function createExpense(payload) {
  const { data } = await http.post('/expenses', payload)
  return data
}

export async function updateExpense(id, payload) {
  const { data } = await http.put(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id) {
  await http.delete(`/expenses/${id}`)
}

// ── Reports ──────────────────────────────────────────────────────────
export async function fetchDailyDetail(params) {
  const { data } = await http.get('/reports/daily-detail', { params })
  return data
}

export async function fetchMonthlyReport(params) {
  const { data } = await http.get('/reports/monthly', { params })
  return data
}

export async function fetchQuarterlyReport(params) {
  const { data } = await http.get('/reports/quarterly', { params })
  return data
}

// ── Orders ───────────────────────────────────────────────────────────
export async function fetchOrders(params) {
  const { data } = await http.get('/orders', { params })
  return data.map(normalizeOrder)
}

export async function createOrder(payload) {
  const { data } = await http.post('/orders', payload)
  return normalizeOrder(data)
}

export async function refundOrder(mongoId) {
  const { data } = await http.patch(`/orders/${mongoId}/refund`)
  return normalizeOrder(data)
}
