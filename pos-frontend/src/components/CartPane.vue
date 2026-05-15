<script setup>
import { ref, computed } from 'vue'
import PaymentModal from './PaymentModal.vue'
import OrderConfirmModal from './OrderConfirmModal.vue'

const props = defineProps({
  cart:   { type: Array, required: true },
  orders: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:cart', 'checkout'])

// ── Order type & discount ────────────────────────────────────────────
const orderType = ref('takeaway')   // 'takeaway' | 'dinein'
const discount  = ref(0)            // percentage: 0 | 5 | 10 | 15 | 20

// ── Totals ───────────────────────────────────────────────────────────
const subtotal     = computed(() => props.cart.reduce((s, l) => s + l.total, 0))
const discountAmt  = computed(() => Math.round(subtotal.value * discount.value / 100))
const grandTotal   = computed(() => subtotal.value - discountAmt.value)
const itemCount    = computed(() => props.cart.reduce((s, l) => s + l.qty, 0))

// ── Cart mutations ───────────────────────────────────────────────────
function updateQty(uid, delta) {
  emit('update:cart', props.cart.map(l => {
    if (l.uid !== uid) return l
    const qty = Math.max(1, l.qty + delta)
    return { ...l, qty, total: l.unitPrice * qty }
  }))
}

function removeLine(uid) {
  emit('update:cart', props.cart.filter(l => l.uid !== uid))
}

function clearCart() {
  emit('update:cart', [])
}

// ── Checkout ─────────────────────────────────────────────────────────
const paying    = ref(false)
const confirming = ref(false)
const pendingCheckout = ref(null)

const sessionCount = ref(0)  // 本 session 已送出的單數，API 回來前即時 +1

const nextOrderNo = computed(() => {
  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const yymmdd = todayStr.slice(2).replace(/-/g, '')
  const fromDB  = props.orders.filter(o => o.date === todayStr).length
  const count   = Math.max(fromDB, sessionCount.value)
  return `ORD-${yymmdd}-${String(count + 1).padStart(4, '0')}`
})

function handleConfirm(payment) {
  pendingCheckout.value = {
    subtotal:  subtotal.value,
    discount:  discountAmt.value,
    total:     grandTotal.value,
    orderType: orderType.value,
    payment,
    lines:     props.cart,
  }
  paying.value = false
  confirming.value = true
}

function handleDone() {
  sessionCount.value++
  emit('checkout', pendingCheckout.value)
  pendingCheckout.value = null
  confirming.value = false
}

// ── Modifier summary (display text for each cart line) ───────────────
function modSummary(line) {
  const parts = []

  if (line.selects?.length) {
    const counts = {}
    line.selects.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1 })
    const text = Object.entries(counts)
      .map(([name, n]) => n > 1 ? `${name} ×${n}` : name).join('、')
    parts.push('選料：' + text)
  }

  if (line.bobaFlavors?.length) {
    const counts = {}
    line.bobaFlavors.forEach(f => { counts[f.name] = (counts[f.name] || 0) + 1 })
    const text = Object.entries(counts)
      .map(([name, n]) => n > 1 ? `${name} ×${n}` : name).join('、')
    parts.push('包餡口味：' + text)
  }

  if (line.upgradedBobas > 0) {
    parts.push(`升級包餡湯圓 ×${line.upgradedBobas}`)
  }

  if (line.addons?.length) {
    const text = line.addons
      .map(a => a.qty > 1 ? `${a.name} ×${a.qty}` : a.name)
      .join('、')
    parts.push('加料：' + text)
  }

  if (line.addonBobaQty > 0) {
    let bobaText = `包餡湯圓加料 ×${line.addonBobaQty}`
    if (line.addonBobaFlavors?.length) {
      const counts = {}
      line.addonBobaFlavors.forEach(f => { counts[f.name] = (counts[f.name] || 0) + 1 })
      const flavText = Object.entries(counts)
        .map(([name, n]) => n > 1 ? `${name} ×${n}` : name).join('、')
      bobaText += `（${flavText}）`
    }
    parts.push(bobaText)
  }

  return parts.join(' · ') || null
}

const orderTag = computed(() => nextOrderNo.value.slice(-4))

</script>

<template>
  <aside class="cart-pane">

    <!-- ── Header ── -->
    <header class="cart-header">
      <div>
        <div class="cart-title">當前訂單</div>
        <div class="cart-sub">#{{orderTag  }} · {{ itemCount }} 份</div>
      </div>
      <button v-if="cart.length" class="btn-ghost-sm" @click="clearCart">清空</button>
    </header>

    <!-- ── Order type ── -->
    <div class="cart-type">
      <button
        class="type-btn"
        :class="{ active: orderType === 'takeaway' }"
        @click="orderType = 'takeaway'"
      >外帶</button>
      <button
        class="type-btn"
        :class="{ active: orderType === 'dinein' }"
        @click="orderType = 'dinein'"
      >內用</button>
    </div>

    <!-- ── Cart lines ── -->
    <div class="cart-lines">
      <template v-if="cart.length === 0">
        <div class="empty">
          <div class="empty-icon">◌</div>
          <div class="empty-title">尚未加入品項</div>
          <div class="empty-hint">從左側菜單選一樣開始</div>
        </div>
      </template>

      <div v-for="line in cart" :key="line.uid" class="cart-line">
        <div class="line-swatch" :style="{ background: line.color }" />
        <div class="line-meta">
          <div class="line-top">
            <span class="line-name">{{ line.name }}</span>
            <button class="line-x" @click="removeLine(line.uid)">×</button>
          </div>

          <!-- modifier summary -->
          <span v-if="modSummary(line)" class="mod-summary">
            {{ modSummary(line) }}
          </span>
          <div v-if="line.note" class="line-note">★ {{ line.note }}</div>

          <div class="line-bot">
            <div class="line-qty">
              <button @click="updateQty(line.uid, -1)">−</button>
              <span>{{ line.qty }}</span>
              <button @click="updateQty(line.uid, +1)">＋</button>
            </div>
            <span class="line-price">${{ line.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Totals ── -->
    <div class="cart-totals">
      <div class="total-row">
        <span>小計</span>
        <span>${{ subtotal }}</span>
      </div>
      <div class="total-row">
        <span class="discount-row">
          <span>折扣</span>
          <select v-model.number="discount">
            <option :value="0">無</option>
            <option :value="5">5%</option>
            <option :value="10">10%</option>
            <option :value="15">15%</option>
            <option :value="20">20%</option>
          </select>
        </span>
        <span>− ${{ discountAmt }}</span>
      </div>
      <div class="total-row total-grand">
        <span>應收</span>
        <span>${{ grandTotal }}</span>
      </div>
    </div>

    <!-- ── Checkout button ── -->
    <button
      class="btn-primary btn-checkout"
      :disabled="cart.length === 0"
      @click="paying = true"
    >結帳 ${{ grandTotal }}</button>

    <!-- ── Payment modal ── -->
    <PaymentModal
      v-if="paying"
      :total="grandTotal"
      :item-count="itemCount"
      :order-type="orderType"
      @close="paying = false"
      @confirm="handleConfirm"
    />

    <!-- ── Order confirmation modal ── -->
    <OrderConfirmModal
      v-if="confirming && pendingCheckout"
      :lines="pendingCheckout.lines"
      :total="pendingCheckout.total"
      :order-type="pendingCheckout.orderType"
      :payment="pendingCheckout.payment"
      :next-order-no="orderTag"
      @done="handleDone"
    />

  </aside>
</template>
