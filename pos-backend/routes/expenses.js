const router  = require('express').Router()
const Expense = require('../models/Expense')

// GET /api/expenses?month=YYYY-MM
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
    const list = await Expense.find(filter).sort({ date: -1 }).lean()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function pickExpense(body) {
  const { date, category, amount, desc, receipt } = body
  return { date, category, amount, desc, receipt }
}

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const doc = await Expense.create(pickExpense(req.body))
    res.status(201).json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(req.params.id, pickExpense(req.body), { returnDocument: 'after', runValidators: true })
    if (!doc) return res.status(404).json({ error: '費用不存在' })
    res.json(doc)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ error: '費用不存在' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
