const router  = require('express').Router()
const Product = require('../models/Product')

// GET /api/products?cat=redbean&available=true
router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.cat)       filter.cat         = req.query.cat
    if (req.query.available) filter.isAvailable = req.query.available === 'true'

    const products = await Product.find(filter).sort({ cat: 1, createdAt: 1 }).lean()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) return res.status(404).json({ error: '商品不存在' })
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

function pickProduct(body) {
  const { cat, name, en, price, color, desc, note, isAvailable, modifierProfile } = body
  return { cat, name, en, price, color, desc, note, isAvailable, modifierProfile }
}

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(pickProduct(req.body))
    res.status(201).json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/products/:id — full update
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      pickProduct(req.body),
      { new: true, runValidators: true }
    )
    if (!product) return res.status(404).json({ error: '商品不存在' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/products/:id/availability — toggle on/off
router.patch('/:id/availability', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isAvailable: req.body.isAvailable },
      { new: true }
    )
    if (!product) return res.status(404).json({ error: '商品不存在' })
    res.json(product)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: '商品不存在' })
    res.json({ message: '已刪除' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
