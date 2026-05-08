<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  orders: { type: Array, required: true },
})
const emit = defineEmits(['refund'])

const _now  = new Date()
const today = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`
const selected = ref(null)

const todayOrders = computed(() =>
  props.orders
    .filter(o => o.date === today)
    .sort((a, b) => b.ts.localeCompare(a.ts))
)

const completedOrders = computed(() => todayOrders.value.filter(o => o.status === 'completed'))
const todayRev        = computed(() => completedOrders.value.reduce((s, o) => s + o.total, 0))

const PAY_LABEL = { cash: '現金', card: '信用卡', linepay: 'LINE Pay', jko: '街口' }

function timeStr(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function dateStr(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}
function fullTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
  return `${date} ${time}`
}

async function handleRefund(order) {
  if (!confirm(`確定要退款 ${order.id}？金額將歸零。`)) return
  emit('refund', order._id)
  selected.value = null
}
</script>

<template>
  <div class="hs">

    <!-- ── Header ── -->
    <header class="hs-header">
      <div class="hs-title-block">
        <h1 class="hs-title">訂單歷史</h1>
        <p class="hs-sub">{{ today }} · 僅顯示今日紀錄</p>
      </div>
    </header>

    <!-- ── Stats row ── -->
    <div class="hs-stats">
      <div class="hs-stat">
        <span class="hs-stat-label">今日訂單</span>
        <span class="hs-stat-num">{{ completedOrders.length }}</span>
        <span class="hs-stat-sub">完成</span>
      </div>
      <div class="hs-stat">
        <span class="hs-stat-label">今日營收</span>
        <span class="hs-stat-num">${{ todayRev.toLocaleString() }}</span>
      </div>
      <div class="hs-stat">
        <span class="hs-stat-label">顯示中</span>
        <span class="hs-stat-num">{{ todayOrders.length }}</span>
        <span class="hs-stat-sub">筆</span>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="hs-body">

      <!-- Left: list -->
      <div class="hs-list">
        <div v-if="todayOrders.length === 0" class="hs-empty">
          <div class="hs-empty-icon">≡</div>
          <div class="hs-empty-title">今日尚無訂單</div>
        </div>

        <button
          v-for="o in todayOrders"
          :key="o._id"
          class="hs-row"
          :class="{ 'hs-row--active': selected?._id === o._id, 'hs-row--refunded': o.status === 'refunded' }"
          @click="selected = o"
        >
          <!-- 欄1：訂單編號（前3碼 + 後4碼） -->
          <div class="hs-col-no">
            <span class="hs-orderno">{{ o.id.slice(0,3) + o.id.slice(-4) }}</span>
          </div>

          <!-- 欄2：時間 -->
          <div class="hs-col-time">
            <span class="hs-time">{{ timeStr(o.ts) }}</span>
            <span class="hs-date">{{ dateStr(o.ts) }}</span>
          </div>

          <!-- 欄3：完整品項 -->
          <div class="hs-col-items">
            <span v-for="(it, i) in o.items" :key="i" class="hs-item-line">
              {{ it.name }} <em>×{{ it.qty }}</em>
            </span>
          </div>

          <!-- 欄4：付款 + 金額 -->
          <div class="hs-col-right">
            <span class="hs-pay-badge" :class="{ 'hs-pay-badge--refund': o.status === 'refunded' }">
              {{ o.status === 'refunded' ? '已退款' : (PAY_LABEL[o.payment] ?? o.payment) }}
            </span>
            <span class="hs-amount" :class="{ 'hs-amount--zero': o.status === 'refunded' }">
              ${{ o.total }}
            </span>
          </div>
        </button>
      </div>

      <!-- Right: detail -->
      <aside class="hs-detail">

        <!-- Empty state -->
        <div v-if="!selected" class="hs-detail-empty">
          <div class="hs-detail-empty-icon">≡</div>
          <p>點選左側訂單</p>
          <span>檢視詳細內容</span>
        </div>

        <!-- Detail card -->
        <template v-else>
          <div class="hs-detail-head">
            <div>
              <div class="hs-detail-orderno">{{ selected.id }}</div>
              <div class="hs-detail-ts">{{ fullTs(selected.ts) }}</div>
            </div>
            <span class="hs-status-badge" :class="selected.status === 'refunded' ? 'badge--refund' : 'badge--ok'">
              {{ selected.status === 'refunded' ? '已退款' : '已完成' }}
            </span>
          </div>

          <div class="hs-detail-items">
            <div v-for="(it, i) in selected.items" :key="i" class="hs-detail-item">
              <div class="hs-di-top">
                <span class="hs-di-name">{{ it.name }}</span>
                <span class="hs-di-qty">× {{ it.qty }}</span>
                <span class="hs-di-price">${{ it.price }}</span>
              </div>
              <div class="hs-di-mods">
                <span v-if="it.selects?.length">選料：{{ it.selects.join('、') }}</span>
                <span v-if="it.bobaFlavors?.length">包餡口味：{{ it.bobaFlavors.join('、') }}</span>
                <span v-if="it.upgradedBobas > 0">升級包餡湯圓 ×{{ it.upgradedBobas }}</span>
                <span v-if="it.addons?.length">
                  加料：{{ it.addons.map(a => a.qty > 1 ? `${a.name} ×${a.qty}` : a.name).join('、') }}
                </span>
                <span v-if="it.note" class="hs-di-note">★ {{ it.note }}</span>
              </div>
            </div>
          </div>

          <div class="hs-detail-footer">
            <div class="hs-footer-row">
              <span>付款方式</span>
              <span>{{ PAY_LABEL[selected.payment] ?? selected.payment }}</span>
            </div>
            <div class="hs-footer-row hs-footer-total">
              <span>合計</span>
              <span>${{ selected.total }}</span>
            </div>
            <button
              v-if="selected.status !== 'refunded'"
              class="hs-refund-btn"
              @click="handleRefund(selected)"
            >退款</button>
            <div v-else class="hs-refunded-note">此訂單已退款，金額已歸零</div>
          </div>
        </template>

      </aside>
    </div>

  </div>
</template>

