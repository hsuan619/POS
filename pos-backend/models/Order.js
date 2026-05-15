const mongoose = require('mongoose')

// 加購料（付費加料）
const addonSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  qty:   { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },   // 此料每份單價
}, { _id: false })

// 訂單內一行品項，完整記錄所有選擇
const orderItemSchema = new mongoose.Schema({
  pid:           { type: String },            // 對應商品 _id（快照，不作 ref）
  name:          { type: String, required: true },
  qty:           { type: Number, required: true, min: 1 },
  unitPrice:     { type: Number, required: true },  // 單份含所有加價後的價格
  price:         { type: Number, required: true },  // unitPrice × qty
  selects:       [{ type: String }],          // 免費選料名稱列表
  bobaFlavors:   [{ type: String }],          // 包餡湯圓口味名稱列表
  upgradedBobas: { type: Number, default: 0 },// 升級包餡湯圓數量
  addons:        { type: [addonSchema], default: [] },
  note:          { type: String, default: '' },
}, { _id: false })

const orderSchema = new mongoose.Schema({
  orderNo:  { type: String, unique: true },
  items:    { type: [orderItemSchema], required: true },
  subtotal: { type: Number, required: true },   // 折扣前小計
  discount: { type: Number, default: 0 },       // 折扣金額
  total:    { type: Number, required: true },   // 實收金額
  payment:  { type: String, enum: ['cash', 'card', 'linepay', 'jko'], default: 'cash' },
  note:     { type: String, default: '' },
  status:   { type: String, enum: ['completed', 'refunded'], default: 'completed' },
}, { timestamps: true })

// createdAt + status 是所有報表查詢的核心，compound index 同時覆蓋排序與 countDocuments
orderSchema.index({ createdAt: 1, status: 1 })

// 自動產生 orderNo：ORD-YYMMDD-流水號（依當天 DB 內筆數遞增，從 0001 起）
orderSchema.pre('save', async function () {
  if (this.isNew && !this.orderNo) {
    const now    = new Date()
    const yy     = String(now.getFullYear()).slice(2)
    const mm     = String(now.getMonth() + 1).padStart(2, '0')
    const dd     = String(now.getDate()).padStart(2, '0')
    const prefix = `ORD-${yy}${mm}${dd}-`

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd   = new Date(todayStart.getTime() + 86400000)

    const todayCount = await mongoose.model('Order').countDocuments({
      createdAt: { $gte: todayStart, $lt: todayEnd },
    })

    this.orderNo = prefix + String(todayCount + 1).padStart(4, '0')
  }
})

module.exports = mongoose.model('Order', orderSchema)
