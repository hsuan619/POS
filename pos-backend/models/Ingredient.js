const mongoose = require('mongoose')

const ingredientSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  color: { type: String, default: '#888888' },
  group: { type: String, enum: ['regular', 'boba'], required: true },
  order: { type: Number, default: 0 },
}, { timestamps: true })

ingredientSchema.index({ group: 1, order: 1 })

module.exports = mongoose.model('Ingredient', ingredientSchema)
