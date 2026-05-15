<script setup>
import { ref, onMounted } from 'vue'
import { CATEGORIES, MODIFIER_RULES } from './data/seed.js'
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchIngredients, createIngredient, updateIngredient, deleteIngredient, fetchOrders, createOrder, refundOrder, getToken, clearToken } from './api/index.js'
import OrderScreen    from './components/OrderScreen.vue'
import HistoryScreen  from './components/HistoryScreen.vue'
import ReportScreen   from './components/ReportScreen.vue'
import ProductsScreen    from './components/ProductsScreen.vue'
import AccountingScreen from './components/AccountingScreen.vue'
import LoginScreen    from './components/LoginScreen.vue'

const authed      = ref(!!getToken())
const view        = ref('order')
const drawerOpen  = ref(false)
const products    = ref([])
const orders      = ref([])
const ingredients = ref([])
const loading     = ref(true)

const NAV = [
  { id: 'order',    label: '點餐', icon: '◐' },
  { id: 'history',  label: '訂單', icon: '≡' },
  { id: 'report',   label: '報表', icon: '△' },
  { id: 'products',   label: '商品', icon: '▦' },
  { id: 'accounting', label: '帳務', icon: '¥' },
]

async function loadData() {
  loading.value = true
  try {
    const [prods, ords, ingrs] = await Promise.all([fetchProducts(), fetchOrders(), fetchIngredients()])
    products.value    = prods
    orders.value      = ords
    ingredients.value = ingrs
  } catch {
    authed.value = false
  } finally {
    loading.value = false
  }
}

function handleLoginSuccess() {
  authed.value = true
  loadData()
}

function handleLogout() {
  clearToken()
  authed.value = false
}

onMounted(() => {
  if (authed.value) loadData()
  else loading.value = false
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
      addons: [
        ...(l.addons?.map(a => ({ name: a.name, qty: a.qty, price: a.delta })) ?? []),
        ...(l.addonBobaQty > 0 ? [{ name: '包餡湯圓加料', qty: l.addonBobaQty, price: l.addonBobaDelta }] : []),
      ],
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

// ── 配料管理 ──────────────────────────────────────────────────────
async function handleIngredientsUpdate(newList) {
  // 刪除
  const deleted = ingredients.value.find(i => !newList.find(n => n.id === i.id))
  if (deleted) {
    await deleteIngredient(deleted.id)
    ingredients.value = ingredients.value.filter(i => i.id !== deleted.id)
    return
  }
  // 新增（isNew flag）
  const added = newList.find(i => i.isNew)
  if (added) {
    const { isNew, id, ...data } = added
    const saved = await createIngredient(data)
    ingredients.value = [...ingredients.value, saved]
    return
  }
  // 更新
  const changed = newList.find(i => {
    const old = ingredients.value.find(o => o.id === i.id)
    return old && JSON.stringify(old) !== JSON.stringify(i)
  })
  if (changed) {
    const { id, ...data } = changed
    const saved = await updateIngredient(id, data)
    ingredients.value = ingredients.value.map(i => i.id === saved.id ? saved : i)
  }
}

// ── 退款：金額歸零、狀態改 refunded ──────────────────────────────
async function handleRefund(mongoId) {
  const updated = await refundOrder(mongoId)
  orders.value = orders.value.map(o => o._id === mongoId ? updated : o)
}
</script>

<template>
  <LoginScreen v-if="!authed" @success="handleLoginSuccess" />

  <div v-else class="app app-pill">
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
        <div class="user-avatar">水</div>
        <div>
          <div class="user-name">阿水</div>
          <div class="user-role">店長 · 13:00–20:30</div>
        </div>
        <button class="logout-btn" @click="handleLogout" title="登出">⏻</button>
      </div>
    </header>

    <!-- 漢堡按鈕（僅小螢幕顯示） -->
    <button class="hamburger-btn" @click="drawerOpen = true">☰</button>

    <!-- Drawer backdrop -->
    <div v-if="drawerOpen" class="drawer-backdrop" @click="drawerOpen = false" />

    <!-- Drawer sidebar -->
    <nav class="drawer" :class="{ 'drawer--open': drawerOpen }">
      <div class="drawer-head">
        <div class="brand-mark">圓</div>
        <div>
          <div class="brand-name">巷口湯圓</div>
          <div class="brand-sub">POS 系統</div>
        </div>
        <button class="drawer-close" @click="drawerOpen = false">✕</button>
      </div>
      <div class="drawer-nav">
        <button
          v-for="n in NAV"
          :key="n.id"
          class="drawer-nav-btn"
          :class="{ active: view === n.id }"
          @click="view = n.id; drawerOpen = false"
        >
          <span class="nav-icon">{{ n.icon }}</span>
          <span>{{ n.label }}</span>
        </button>
      </div>
      <div class="drawer-user">
        <div class="user-avatar">水</div>
        <div>
          <div class="user-name">阿水</div>
          <div class="user-role">店長 · 13:00–20:30</div>
        </div>
        <button class="logout-btn" @click="handleLogout">⏻</button>
      </div>
    </nav>

    <div class="app-content">
      <div v-if="loading" class="empty" style="height:100%">
        <div class="empty-icon">◌</div>
        <div class="empty-title">載入中…</div>
      </div>

      <template v-else>
        <OrderScreen
          v-if="view === 'order'"
          :products="products"
          :orders="orders"
          :categories="CATEGORIES"
          :ingredients="ingredients"
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
          :ingredients="ingredients"
          @update:products="handleProductsUpdate"
          @update:ingredients="handleIngredientsUpdate"
        />
        <AccountingScreen v-else-if="view === 'accounting'" />
      </template>
    </div>
  </div>
</template>
