const router   = require('express').Router()
const Order    = require('../models/Order')
const Purchase = require('../models/Purchase')
const Expense  = require('../models/Expense')

function dayRange(dateStr) {
  const start = new Date(dateStr)
  const end   = new Date(dateStr)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) }
}

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)
    const [summary] = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
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
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
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
      { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.price' } } },
      { $sort: { qty: -1 } },
      { $limit: 10 },
    ])
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/daily-detail?date=YYYY-MM-DD
router.get('/daily-detail', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)
    const match = { createdAt: { $gte: start, $lt: end }, status: 'completed' }

    const [summaryArr, products, selects] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.price' } } },
        { $sort: { qty: -1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $unwind: '$items.selects' },
        { $group: { _id: '$items.selects', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])

    res.json({
      summary:  summaryArr[0] || { revenue: 0, orders: 0 },
      products,
      selects,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/monthly?month=YYYY-MM
router.get('/monthly', async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.month)
    const match = { createdAt: { $gte: start, $lt: end }, status: 'completed' }

    const [summaryArr, products, selects, purchasesArr, expensesArr] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.price' } } },
        { $sort: { qty: -1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $unwind: '$items.selects' },
        { $group: { _id: '$items.selects', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Purchase.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ])

    const revenue   = summaryArr[0]?.revenue   ?? 0
    const purchases = purchasesArr[0]?.total   ?? 0
    const expenses  = expensesArr[0]?.total    ?? 0

    res.json({
      summary: { revenue, orders: summaryArr[0]?.orders ?? 0, purchases, expenses, net: revenue - purchases - expenses },
      products,
      selects,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/quarterly?year=YYYY&quarter=1~4
router.get('/quarterly', async (req, res) => {
  try {
    const year    = parseInt(req.query.year)
    const quarter = parseInt(req.query.quarter)
    const startM  = (quarter - 1) * 3 + 1

    const months = await Promise.all(
      [0, 1, 2].map(async (i) => {
        const m     = startM + i
        const start = new Date(year, m - 1, 1)
        const end   = new Date(year, m, 1)
        const match = { createdAt: { $gte: start, $lt: end }, status: 'completed' }

        const [orderArr, purchaseArr, expenseArr] = await Promise.all([
          Order.aggregate([{ $match: match }, { $group: { _id: null, revenue: { $sum: '$total' } } }]),
          Purchase.aggregate([{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
          Expense.aggregate([{ $match: { date: { $gte: start, $lt: end } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        ])

        const revenue   = orderArr[0]?.revenue   ?? 0
        const purchases = purchaseArr[0]?.total  ?? 0
        const expenses  = expenseArr[0]?.total   ?? 0
        return { month: `${year}-${String(m).padStart(2, '0')}`, revenue, purchases, expenses, net: revenue - purchases - expenses }
      })
    )

    res.json({ months })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
