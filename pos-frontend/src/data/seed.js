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
