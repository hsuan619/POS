// Run: node seed.js
// Clears products collection and inserts all products from frontend seed data
require('dotenv').config()
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
const Product  = require('./models/Product')

const PRODUCTS = [
  { cat: 'redbean', name: '招牌湯圓紅豆湯', price: 65, color: '#8a3026', desc: '小湯圓、包餡湯圓 ×4',              note: '不加冰請先告知',              modifierProfile: { selectCount: 1, upgradeBoba: true,  bobaCount: 4 } },
  { cat: 'redbean', name: '芋圓紅豆湯',     price: 55, color: '#8a3026', desc: '芋圓 + 紅豆湯',                    note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { cat: 'redbean', name: '小湯圓紅豆湯',   price: 55, color: '#8a3026', desc: '小湯圓 + 紅豆湯',                  note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { cat: 'redbean', name: '紅豆紫米鮮奶',   price: 65, color: '#a35e6f', desc: '紅豆 + 紫米 + 鮮奶',              note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { cat: 'grass',   name: '招牌湯圓仙草凍', price: 65, color: '#1c1614', desc: '花豆、芋圓、包餡湯圓 ×1、鮮奶',   note: '添加鮮奶油 · 不加冰請先告知', modifierProfile: { selectCount: 2, upgradeBoba: true,  bobaCount: 1 } },
  { cat: 'grass',   name: '綜合仙草凍',     price: 65, color: '#1c1614', desc: '任選三種料（不含包餡湯圓）、鮮奶', note: '添加鮮奶油',                  modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { cat: 'grass',   name: '芋圓鮮奶仙草凍', price: 65, color: '#1c1614', desc: '芋圓 + 鮮奶 + 仙草凍',             note: '添加鮮奶油',                  modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { cat: 'ice',     name: '黑糖三種冰',     price: 50, color: '#3b2418', desc: '任選三種料（不含包餡湯圓）',       note: '黑糖剉冰',                    modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { cat: 'ice',     name: '黑糖五種冰',     price: 65, color: '#3b2418', desc: '任選五種料（不含包餡湯圓）',       note: '黑糖剉冰',                    modifierProfile: { selectCount: 5, upgradeBoba: true,  bobaCount: 0 } },
  { cat: 'winter',  name: '綜合燒仙草',     price: 55, color: '#2a1e1a', desc: '任選三種料（不含包餡湯圓）',       note: '含硬花生',                    modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { cat: 'winter',  name: '芋圓燒仙草',     price: 55, color: '#2a1e1a', desc: '芋圓 + 燒仙草',                   note: '含硬花生',                    modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { cat: 'winter',  name: '純燒仙草',       price: 45, color: '#2a1e1a', desc: '純粹的燒仙草',                    note: '含硬花生',                    modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
]

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('MongoDB 連線成功')

  await Product.deleteMany({})
  const inserted = await Product.insertMany(PRODUCTS)
  console.log(`已匯入 ${inserted.length} 筆商品`)

  await mongoose.disconnect()
  console.log('完成')
}

seed().catch(err => {
  console.error(err)
  process.exit(1)
})
