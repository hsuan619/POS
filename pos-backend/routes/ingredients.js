const router     = require('express').Router()
const Ingredient = require('../models/Ingredient')

const SEED = [
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

// GET /api/ingredients — auto-seed if collection is empty
router.get('/', async (req, res) => {
  try {
    const count = await Ingredient.countDocuments()
    if (count === 0) await Ingredient.insertMany(SEED)
    const list = await Ingredient.find().sort({ group: 1, order: 1, createdAt: 1 })
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/ingredients
router.post('/', async (req, res) => {
  try {
    const item = await Ingredient.create(req.body)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/ingredients/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await Ingredient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ error: '配料不存在' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/ingredients/:id
router.delete('/:id', async (req, res) => {
  try {
    const item = await Ingredient.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ error: '配料不存在' })
    res.json({ message: '已刪除' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
