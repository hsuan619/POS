const mongoose = require('mongoose')

const CATEGORIES = ['水電', '租金', '人事', '耗材', '其他']

const expenseSchema = new mongoose.Schema({
  date:     { type: Date, required: true },
  category: { type: String, enum: CATEGORIES, default: '其他' },
  amount:   { type: Number, required: true },
  desc:     { type: String, default: '' },
  receipt:  { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('Expense', expenseSchema)
