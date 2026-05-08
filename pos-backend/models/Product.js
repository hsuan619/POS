const mongoose = require('mongoose')

const modifierProfileSchema = new mongoose.Schema({
  selectCount: { type: Number, default: 0 },
  upgradeBoba: { type: Boolean, default: false },
  bobaCount:   { type: Number, default: 0 },
}, { _id: false })

const productSchema = new mongoose.Schema({
  cat:             { type: String, required: true },
  name:            { type: String, required: true },
  price:           { type: Number, required: true, min: 0 },
  color:           { type: String, default: '#888888' },
  desc:            { type: String, default: '' },
  note:            { type: String, default: '' },
  isAvailable:     { type: Boolean, default: true },
  modifierProfile: { type: modifierProfileSchema, default: () => ({}) },
}, { timestamps: true })

module.exports = mongoose.model('Product', productSchema)
