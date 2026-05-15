require('dotenv').config()
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const express   = require('express')
const mongoose  = require('mongoose')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')
const crypto    = require('crypto')

const app = express()

// ── Security headers ─────────────────────────────────────────────────
app.use(helmet())

// ── CORS — 只允許指定前端來源 ─────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, cb) => {
    // 允許無 origin（如 Postman、server-to-server）和白名單來源
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error('不允許的來源'))
  },
  credentials: true,
}))

app.use(express.json({ limit: '100kb' }))

// ── Rate limit：登入最多 10 次 / 15 分鐘 ─────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '嘗試次數過多，請 15 分鐘後再試' },
})

// ── Timing-safe 比對，防止 timing attack ─────────────────────────────
function safeEqual(a, b) {
  if (!a || !b) return false
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length))
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

// ── Auth ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { password } = req.body
  if (!safeEqual(password, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: '密碼錯誤' })
  }
  res.json({ token: process.env.ADMIN_TOKEN })
})

function requireAuth(req, res, next) {
  const auth  = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!safeEqual(token, process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ error: '未授權' })
  }
  next()
}

app.use('/api/products',    requireAuth, require('./routes/products'))
app.use('/api/ingredients', requireAuth, require('./routes/ingredients'))
app.use('/api/orders',      requireAuth, require('./routes/orders'))
app.use('/api/reports',     requireAuth, require('./routes/reports'))
app.use('/api/purchases',   requireAuth, require('./routes/purchases'))
app.use('/api/expenses',    requireAuth, require('./routes/expenses'))

// ── 全域錯誤處理：生產環境不回傳內部細節 ────────────────────────────
app.use((err, req, res, next) => {
  console.error(err)
  const isProd = process.env.NODE_ENV === 'production'
  res.status(500).json({ error: isProd ? '伺服器錯誤' : err.message })
})

const INGR_SEED = [
  { name: '黑糖珍珠', color: '#3b2418', group: 'regular', order: 1 },
  { name: '小湯圓',   color: '#f3d3c2', group: 'regular', order: 2 },
  { name: '芋圓',     color: '#a98ac0', group: 'regular', order: 3 },
  { name: '紅豆',     color: '#7a2d20', group: 'regular', order: 4 },
  { name: '花豆',     color: '#a47557', group: 'regular', order: 5 },
  { name: '軟花生',   color: '#dcc498', group: 'regular', order: 6 },
  { name: '抹茶湯圓', color: '#5e7e3f', group: 'boba',    order: 1 },
  { name: '芋頭湯圓', color: '#9f7eb9', group: 'boba',    order: 2 },
  { name: '花生湯圓', color: '#d4a766', group: 'boba',    order: 3 },
  { name: '芝麻湯圓', color: '#231d1a', group: 'boba',    order: 4 },
]

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB 連線成功')
    const Ingredient = require('./models/Ingredient')
    const count = await Ingredient.countDocuments()
    if (count === 0) {
      await Ingredient.insertMany(INGR_SEED)
      console.log('配料初始資料已建立')
    }
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Server running on port ${process.env.PORT || 3000}`)
    )
  })
  .catch(err => {
    console.error('MongoDB 連線失敗', err.message)
    process.exit(1)
  })
