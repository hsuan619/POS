const mongoose = require('mongoose')

const purchaseItemSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  qty:      { type: Number, required: true },
  unit:     { type: String, default: '' },
  unitCost: { type: Number, required: true },
  total:    { type: Number, required: true },
}, { _id: false })

const purchaseSchema = new mongoose.Schema({
  date:     { type: Date, required: true },
  supplier: { type: String, default: '' },
  items:    [purchaseItemSchema],
  total:    { type: Number, required: true },
  note:     { type: String, default: '' },
}, { timestamps: true })

purchaseSchema.index({ date: 1 })

module.exports = mongoose.model('Purchase', purchaseSchema)
