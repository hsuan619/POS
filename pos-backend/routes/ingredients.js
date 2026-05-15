const router     = require('express').Router()
const Ingredient = require('../models/Ingredient')

// GET /api/ingredients
router.get('/', async (req, res) => {
  try {
    const list = await Ingredient.find().sort({ group: 1, order: 1, createdAt: 1 }).lean()
    res.json(list)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function pickIngredient(body) {
  const { name, color, group, order } = body
  return { name, color, group, order }
}

// POST /api/ingredients
router.post('/', async (req, res) => {
  try {
    const item = await Ingredient.create(pickIngredient(req.body))
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/ingredients/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await Ingredient.findByIdAndUpdate(req.params.id, pickIngredient(req.body), { new: true, runValidators: true })
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
