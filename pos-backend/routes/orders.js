const router = require('express').Router()
const Order  = require('../models/Order')

// GET /api/orders?date=YYYY-MM-DD&status=completed
router.get('/', async (req, res) => {
  try {
    const filter = {}

    if (req.query.date) {
      const start = new Date(req.query.date)
      const end   = new Date(req.query.date)
      end.setDate(end.getDate() + 1)
      filter.createdAt = { $gte: start, $lt: end }
    }
    if (req.query.status) filter.status = req.query.status

    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean()
    res.json(orders)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean()
    if (!order) return res.status(404).json({ error: '訂單不存在' })
    res.json(order)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/orders — create (checkout)
router.post('/', async (req, res) => {
  try {
    const { items, subtotal, discount, total, payment, note } = req.body
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: '品項不可為空' })
    if (typeof subtotal !== 'number' || subtotal < 0 ||
        typeof discount !== 'number' || discount < 0 ||
        typeof total    !== 'number' || total < 0)
      return res.status(400).json({ error: '金額格式錯誤' })
    const order = await Order.create({ items, subtotal, discount, total, payment, note })
    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/orders/:id/refund — 退款：金額歸零、狀態改 refunded
router.patch('/:id/refund', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: 'refunded', total: 0, subtotal: 0, discount: 0 },
      { new: true }
    )
    if (!order) return res.status(404).json({ error: '訂單不存在' })
    res.json(order)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
