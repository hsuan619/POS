export const CATEGORIES = [
  { id: 'redbean', name: '紅豆湯',   en: 'Red Bean Soup' },
  { id: 'grass',   name: '仙草凍',   en: 'Grass Jelly'   },
  { id: 'ice',     name: '冰品',     en: 'Ice Desserts'  },
  { id: 'winter',  name: '冬季限定', en: 'Winter'        },
]

// group: 'regular' = 一般選料 | 'boba' = 包餡湯圓
export const INGREDIENTS = [
  { id: 'blackboba', name: '黑糖珍珠', color: '#3b2418', group: 'regular' },
  { id: 'smallball', name: '小湯圓',   color: '#f3d3c2', group: 'regular' },
  { id: 'taroball',  name: '芋圓',     color: '#a98ac0', group: 'regular' },
  { id: 'redbean',   name: '紅豆',     color: '#7a2d20', group: 'regular' },
  { id: 'huadou',    name: '花豆',     color: '#a47557', group: 'regular' },
  { id: 'peanut',    name: '軟花生',   color: '#dcc498', group: 'regular' },
  { id: 'matcha',    name: '抹茶湯圓', color: '#5e7e3f', group: 'boba'    },
  { id: 'taro',      name: '芋頭湯圓', color: '#9f7eb9', group: 'boba'    },
  { id: 'peanutB',   name: '花生湯圓', color: '#d4a766', group: 'boba'    },
  { id: 'sesame',    name: '芝麻湯圓', color: '#231d1a', group: 'boba'    },
]

export const MODIFIER_RULES = {
  addonRegular: 10,
  addonBoba:    15,
  upgradeBoba:  5,
}

// modifierProfile keys:
//   selectCount  – max 選料 slots (0 = no free-select section)
//   includeBoba  – 包餡湯圓 included in free-select pool (default false)
//   upgradeBoba  – can trade a select slot for a 包餡湯圓 (+$5/slot)
//                  only valid when selectCount > 0
//
// Rule summary (per spec):
//   招牌湯圓紅豆湯  → 1 swap slot
//   招牌湯圓仙草凍  → 2 swap slots
//   任選 N 種 products → N swap slots, can upgrade bobas
//   all others      → no swap, no upgrade
export const PRODUCTS = [
  // 紅豆湯
  { id: 'p01', cat: 'redbean', name: '招牌湯圓紅豆湯', price: 65, color: '#8a3026', desc: '小湯圓、包餡湯圓 ×4',           note: '不加冰請先告知',              modifierProfile: { selectCount: 1, upgradeBoba: true,  bobaCount: 4 } },
  { id: 'p02', cat: 'redbean', name: '芋圓紅豆湯',     price: 55, color: '#8a3026', desc: '芋圓 + 紅豆湯',                 note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { id: 'p03', cat: 'redbean', name: '小湯圓紅豆湯',   price: 55, color: '#8a3026', desc: '小湯圓 + 紅豆湯',               note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { id: 'p04', cat: 'redbean', name: '紅豆紫米鮮奶',   price: 65, color: '#a35e6f', desc: '紅豆 + 紫米 + 鮮奶',           note: '不加冰請先告知',              modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  // 仙草凍
  { id: 'p05', cat: 'grass',   name: '招牌湯圓仙草凍', price: 65, color: '#1c1614', desc: '花豆、芋圓、包餡湯圓 ×1、鮮奶', note: '添加鮮奶油 · 不加冰請先告知', modifierProfile: { selectCount: 2, upgradeBoba: true,  bobaCount: 1 } },
  { id: 'p06', cat: 'grass',   name: '綜合仙草凍',     price: 65, color: '#1c1614', desc: '任選三種料（不含包餡湯圓）、鮮奶', note: '添加鮮奶油',                modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { id: 'p07', cat: 'grass',   name: '芋圓鮮奶仙草凍', price: 65, color: '#1c1614', desc: '芋圓 + 鮮奶 + 仙草凍',          note: '添加鮮奶油',                  modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  // 冰品
  { id: 'p08', cat: 'ice',     name: '黑糖三種冰',     price: 50, color: '#3b2418', desc: '任選三種料（不含包餡湯圓）',    note: '黑糖剉冰',                    modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { id: 'p09', cat: 'ice',     name: '黑糖五種冰',     price: 65, color: '#3b2418', desc: '任選五種料（不含包餡湯圓）',    note: '黑糖剉冰',                    modifierProfile: { selectCount: 5, upgradeBoba: true,  bobaCount: 0 } },
  // 冬季限定
  { id: 'p10', cat: 'winter',  name: '綜合燒仙草',     price: 55, color: '#2a1e1a', desc: '任選三種料（不含包餡湯圓）',    note: '含硬花生',                    modifierProfile: { selectCount: 3, upgradeBoba: true,  bobaCount: 0 } },
  { id: 'p11', cat: 'winter',  name: '芋圓燒仙草',     price: 55, color: '#2a1e1a', desc: '芋圓 + 燒仙草',                note: '含硬花生',                    modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
  { id: 'p12', cat: 'winter',  name: '純燒仙草',       price: 45, color: '#2a1e1a', desc: '純粹的燒仙草',                 note: '含硬花生',                    modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 } },
]

function genOrderHistory() {
  const now = new Date()
  const orders = []
  let oid = 1001
  const regular = INGREDIENTS.filter(i => i.group === 'regular')
  const boba    = INGREDIENTS.filter(i => i.group === 'boba')
  for (let d = 6; d >= 0; d--) {
    const date = new Date(now)
    date.setDate(now.getDate() - d)
    const dow = date.getDay()
    const open = dow === 5 || dow === 6 || dow === 0
    const count = (open ? 56 : 8) + Math.floor(Math.random() * 12 - 6)
    for (let i = 0; i < count; i++) {
      const hour   = 11 + Math.floor((i / count) * 9)
      const minute = Math.floor(Math.random() * 60)
      const orderDate = new Date(date)
      orderDate.setHours(hour, minute, Math.floor(Math.random() * 60), 0)
      const itemCount = 1 + Math.floor(Math.random() * 2)
      const items = []
      let subtotal = 0
      for (let j = 0; j < itemCount; j++) {
        const p    = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
        const qty  = 1 + (Math.random() < 0.2 ? 1 : 0)
        const prof = p.modifierProfile
        const selects = []
        if (prof.selectCount > 0) {
          const pool = [...regular]
          while (selects.length < prof.selectCount && pool.length)
            selects.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].name)
        }
        const toppings = []
        let addonDelta = 0
        if (Math.random() < 0.4) {
          const useBoba = Math.random() < 0.4
          const pool = useBoba ? boba : regular
          const pick = pool[Math.floor(Math.random() * pool.length)]
          toppings.push(pick.name)
          addonDelta += useBoba ? 15 : 10
        }
        const upgrade      = prof.upgradeBoba && Math.random() < 0.25
        const upgradeDelta = upgrade ? 5 : 0
        const linePrice    = (p.price + addonDelta + upgradeDelta) * qty
        items.push({ pid: p.id, name: p.name, qty, selects, toppings, upgrade, price: linePrice })
        subtotal += linePrice
      }
      orders.push({
        id: 'ORD' + (oid++),
        ts: orderDate.toISOString(),
        date: orderDate.toISOString().slice(0, 10),
        hour,
        items,
        total: subtotal,
        status: 'completed',
        payment: ['cash', 'cash', 'linepay', 'card'][Math.floor(Math.random() * 4)],
      })
    }
  }
  return orders
}

export const SEED_ORDERS = genOrderHistory()
