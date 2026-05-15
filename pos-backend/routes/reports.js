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

function validDate(d) { return d instanceof Date && !isNaN(d) }

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)
    if (!validDate(start)) return res.status(400).json({ error: '日期格式錯誤' })
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
    if (!validDate(start) || !validDate(end)) return res.status(400).json({ error: '日期格式錯誤' })
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
    if (!validDate(start)) return res.status(400).json({ error: '日期格式錯誤' })
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
// 原本 3 次 Order aggregate → 1 次 $facet
router.get('/daily-detail', async (req, res) => {
  try {
    const { start, end } = dayRange(req.query.date)
    if (!validDate(start)) return res.status(400).json({ error: '日期格式錯誤' })
    const match = { createdAt: { $gte: start, $lt: end }, status: 'completed' }

    const [facet] = await Order.aggregate([
      { $match: match },
      { $facet: {
        summary: [
          { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
        ],
        products: [
          { $unwind: '$items' },
          { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.price' } } },
          { $sort: { qty: -1 } },
        ],
        selects: [
          { $unwind: '$items' },
          { $unwind: '$items.selects' },
          { $group: { _id: '$items.selects', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
      }},
    ])

    res.json({
      summary:  facet.summary[0]  || { revenue: 0, orders: 0 },
      products: facet.products,
      selects:  facet.selects,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/monthly?month=YYYY-MM
// 原本 3 次 Order aggregate → 1 次 $facet
router.get('/monthly', async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.month)
    const match = { createdAt: { $gte: start, $lt: end }, status: 'completed' }

    const [[orderFacet], purchasesArr, expensesArr] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $facet: {
          summary: [
            { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
          ],
          products: [
            { $unwind: '$items' },
            { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: '$items.price' } } },
            { $sort: { qty: -1 } },
          ],
          selects: [
            { $unwind: '$items' },
            { $unwind: '$items.selects' },
            { $group: { _id: '$items.selects', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
        }},
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

    const revenue   = orderFacet.summary[0]?.revenue ?? 0
    const purchases = purchasesArr[0]?.total          ?? 0
    const expenses  = expensesArr[0]?.total           ?? 0

    res.json({
      summary:  { revenue, orders: orderFacet.summary[0]?.orders ?? 0, purchases, expenses, net: revenue - purchases - expenses },
      products: orderFacet.products,
      selects:  orderFacet.selects,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/reports/quarterly?year=YYYY&quarter=1~4
// 原本 9 次 aggregate → 3 次（每個 collection 含三個月分組）
router.get('/quarterly', async (req, res) => {
  try {
    const year    = parseInt(req.query.year)
    const quarter = parseInt(req.query.quarter)
    if (!year || quarter < 1 || quarter > 4) return res.status(400).json({ error: '參數錯誤' })

    const startM = (quarter - 1) * 3 + 1
    const mDates = [0, 1, 2].map(i => ({
      start: new Date(year, startM - 1 + i, 1),
      end:   new Date(year, startM + i,     1),
    }))
    const qStart = mDates[0].start
    const qEnd   = mDates[2].end

    const [[orderFacet], [purchaseFacet], [expenseFacet]] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: qStart, $lt: qEnd }, status: 'completed' } },
        { $facet: {
          m0: [{ $match: { createdAt: { $gte: mDates[0].start, $lt: mDates[0].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
          m1: [{ $match: { createdAt: { $gte: mDates[1].start, $lt: mDates[1].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
          m2: [{ $match: { createdAt: { $gte: mDates[2].start, $lt: mDates[2].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
        }},
      ]),
      Purchase.aggregate([
        { $match: { date: { $gte: qStart, $lt: qEnd } } },
        { $facet: {
          m0: [{ $match: { date: { $gte: mDates[0].start, $lt: mDates[0].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
          m1: [{ $match: { date: { $gte: mDates[1].start, $lt: mDates[1].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
          m2: [{ $match: { date: { $gte: mDates[2].start, $lt: mDates[2].end } } }, { $group: { _id: null, v: { $sum: '$total' } } }],
        }},
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: qStart, $lt: qEnd } } },
        { $facet: {
          m0: [{ $match: { date: { $gte: mDates[0].start, $lt: mDates[0].end } } }, { $group: { _id: null, v: { $sum: '$amount' } } }],
          m1: [{ $match: { date: { $gte: mDates[1].start, $lt: mDates[1].end } } }, { $group: { _id: null, v: { $sum: '$amount' } } }],
          m2: [{ $match: { date: { $gte: mDates[2].start, $lt: mDates[2].end } } }, { $group: { _id: null, v: { $sum: '$amount' } } }],
        }},
      ]),
    ])

    const months = [0, 1, 2].map(i => {
      const m         = startM + i
      const revenue   = orderFacet[`m${i}`][0]?.v   ?? 0
      const purchases = purchaseFacet[`m${i}`][0]?.v ?? 0
      const expenses  = expenseFacet[`m${i}`][0]?.v  ?? 0
      return { month: `${year}-${String(m).padStart(2, '0')}`, revenue, purchases, expenses, net: revenue - purchases - expenses }
    })

    res.json({ months })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
