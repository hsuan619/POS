const router   = require('express').Router()
const Purchase = require('../models/Purchase')

// GET /api/purchases?month=YYYY-MM
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.month) {
      const [y, m] = req.query.month.split('-').map(Number)
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lt:  new Date(y, m, 1),
      }
    }
    const list = await Purchase.find(filter).sort({ date: -1 }).lean()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function pickPurchase(body) {
  const { date, supplier, items, total, note } = body
  return { date, supplier, items, total, note }
}

// POST /api/purchases
router.post('/', async (req, res) => {
  try {
    const doc = await Purchase.create(pickPurchase(req.body))
    res.status(201).json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/purchases/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findByIdAndUpdate(req.params.id, pickPurchase(req.body), { returnDocument: 'after', runValidators: true })
    if (!doc) return res.status(404).json({ error: '進貨單不存在' })
    res.json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/purchases/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Purchase.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ error: '進貨單不存在' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
