require('dotenv').config()
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

// ── Auth ──────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: '密碼錯誤' })
  }
  res.json({ token: process.env.ADMIN_TOKEN })
})

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || token !== process.env.ADMIN_TOKEN) {
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

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB 連線成功')
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Server running on port ${process.env.PORT || 3000}`)
    )
  })
  .catch(err => {
    console.error('MongoDB 連線失敗', err.message)
    process.exit(1)
  })
