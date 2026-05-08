<script setup>
import { ref, onMounted } from 'vue'
import { CATEGORIES, INGREDIENTS, MODIFIER_RULES } from './data/seed.js'
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchOrders, createOrder, refundOrder } from './api/index.js'
import OrderScreen    from './components/OrderScreen.vue'
import HistoryScreen  from './components/HistoryScreen.vue'
import ReportScreen   from './components/ReportScreen.vue'
import ProductsScreen    from './components/ProductsScreen.vue'
import AccountingScreen from './components/AccountingScreen.vue'

const view     = ref('order')
const products = ref([])
const orders   = ref([])
const loading  = ref(true)

const NAV = [
  { id: 'order',    label: '點餐', icon: '◐' },
  { id: 'history',  label: '訂單', icon: '≡' },
  { id: 'report',   label: '報表', icon: '△' },
  { id: 'products',   label: '商品', icon: '▦' },
  { id: 'accounting', label: '帳務', icon: '¥' },
]

onMounted(async () => {
  try {
    const [prods, ords] = await Promise.all([fetchProducts(), fetchOrders()])
    products.value = prods
    orders.value   = ords
  } finally {
    loading.value = false
  }
})

// ── 結帳：將購物車完整資料寫入後端 ──────────────────────────────
async function handleCheckout(payload) {
  const orderPayload = {
    items: payload.lines.map(l => ({
      pid:           l.pid,
      name:          l.name,
      qty:           l.qty,
      unitPrice:     l.unitPrice,
      price:         l.total,
      selects:       l.selects?.map(s => s.name)     ?? [],
      bobaFlavors:   l.bobaFlavors?.map(f => f.name) ?? [],
      upgradedBobas: l.upgradedBobas ?? 0,
      addons:        l.addons?.map(a => ({ name: a.name, qty: a.qty, price: a.delta })) ?? [],
      note:          l.note ?? '',
    })),
    subtotal: payload.subtotal,
    discount: payload.discount,
    total:    payload.total,
    payment:  payload.payment.method,
  }

  const newOrder = await createOrder(orderPayload)
  orders.value = [newOrder, ...orders.value]
}

// ── 商品管理：比對新舊陣列判斷是新增、更新或刪除 ─────────────────
async function handleProductsUpdate(newList) {
  // 刪除：舊有但新列表沒有
  const deleted = products.value.find(p => !newList.find(n => n.id === p.id))
  if (deleted) {
    await deleteProduct(deleted.id)
    products.value = products.value.filter(p => p.id !== deleted.id)
    return
  }

  // 新增：帶有 isNew 旗標
  const added = newList.find(p => p.isNew)
  if (added) {
    const { id, isNew, ...data } = added
    const saved = await createProduct(data)
    products.value = [...products.value, saved]
    return
  }

  // 更新：比對找出變動的那筆
  const changed = newList.find(p => {
    const old = products.value.find(o => o.id === p.id)
    return old && JSON.stringify(old) !== JSON.stringify(p)
  })
  if (changed) {
    const { id, ...data } = changed
    const saved = await updateProduct(id, data)
    products.value = products.value.map(p => p.id === saved.id ? saved : p)
  }
}

// ── 退款：金額歸零、狀態改 refunded ──────────────────────────────
async function handleRefund(mongoId) {
  const updated = await refundOrder(mongoId)
  orders.value = orders.value.map(o => o._id === mongoId ? updated : o)
}
</script>

<template>
  <div class="app app-pill">
    <header class="topnav">
      <div class="topnav-brand">
        <div class="brand-mark">圓</div>
        <div>
          <div class="brand-name">巷口湯圓</div>
          <div class="brand-sub">POS 系統</div>
        </div>
      </div>

      <nav class="topnav-pills">
        <button
          v-for="n in NAV"
          :key="n.id"
          class="pill"
          :class="{ active: view === n.id }"
          @click="view = n.id"
        >
          <span class="pill-icon">{{ n.icon }}</span>
          <span>{{ n.label }}</span>
        </button>
      </nav>

      <div class="topnav-user">
        <div class="user-avatar">阿</div>
        <div>
          <div class="user-name">阿芳</div>
          <div class="user-role">店長 · 09:00–17:00</div>
        </div>
      </div>
    </header>

    <div class="app-content">
      <div v-if="loading" class="empty" style="height:100%">
        <div class="empty-icon">◌</div>
        <div class="empty-title">載入中…</div>
      </div>

      <template v-else>
        <OrderScreen
          v-if="view === 'order'"
          :products="products"
          :categories="CATEGORIES"
          :ingredients="INGREDIENTS"
          :rules="MODIFIER_RULES"
          card-size="large"
          @checkout="handleCheckout"
        />
        <HistoryScreen  v-else-if="view === 'history'"  :orders="orders" @refund="handleRefund" />
        <ReportScreen   v-else-if="view === 'report'"   :orders="orders" />
        <ProductsScreen
          v-else-if="view === 'products'"
          :products="products"
          :categories="CATEGORIES"
          @update:products="handleProductsUpdate"
        />
        <AccountingScreen v-else-if="view === 'accounting'" />
      </template>
    </div>
  </div>
</template>
