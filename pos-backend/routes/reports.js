const router = require('express').Router()
const Order  = require('../models/Order')

function dayRange(dateStr) {
  const start = new Date(dateStr)
  const end   = new Date(dateStr)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)

    const [summary] = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: 'completed' } },
      { $group: {
        _id:          null,
        totalRevenue: { $sum: '$total' },
        totalOrders:  { $sum: 1 },
      }},
    ])
    res.json(summary || { totalRevenue: 0, totalOrders: 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/period?start=YYYY-MM-DD&end=YYYY-MM-DD
router.get('/period', async (req, res) => {
  try {
    const start = new Date(req.query.start)
    const end   = new Date(req.query.end)
    end.setDate(end.getDate() + 1)

    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: 'completed' } },
      { $group: {
        _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ])
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/top-products?date=YYYY-MM-DD
router.get('/top-products', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)

    const result = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: 'completed' } },
      { $unwind: '$items' },
      { $group: {
        _id:     '$items.name',
        qty:     { $sum: '$items.qty' },
        revenue: { $sum: '$items.price' },
      }},
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ])
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
