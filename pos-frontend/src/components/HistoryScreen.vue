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

<style scoped>
/* ── Shell ── */
.hs {
  display: flex; flex-direction: column;
  height: 100%; padding: 24px 28px; gap: 20px;
  overflow: hidden;
}

/* ── Header ── */
.hs-header { flex-shrink: 0; }
.hs-title {
  font-size: 28px; font-weight: 800;
  letter-spacing: -0.02em; color: var(--ink);
  margin: 0 0 2px;
}
.hs-sub { margin: 0; font-size: 12px; color: var(--ink-3); }

/* ── Stats row ── */
.hs-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 12px; flex-shrink: 0;
}
.hs-stat {
  background: var(--bg-card); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 16px 20px;
  display: flex; flex-direction: column; gap: 2px;
  box-shadow: var(--shadow-1);
}
.hs-stat-label { font-size: 11px; color: var(--ink-3); }
.hs-stat-num   { font-size: 30px; font-weight: 800; font-family: var(--font-en); color: var(--ink); line-height: 1.1; }
.hs-stat-sub   { font-size: 12px; color: var(--ink-3); }

/* ── Body ── */
.hs-body {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 16px;
  flex: 1; min-height: 0;
}

/* ── List ── */
.hs-list {
  background: var(--bg-card); border: 1px solid var(--line);
  border-radius: var(--radius); overflow-y: auto;
}

.hs-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; gap: 6px;
  color: var(--ink-3);
}
.hs-empty-icon  { font-size: 32px; opacity: .3; }
.hs-empty-title { font-size: 14px; }

.hs-row {
  width: 100%; display: flex; align-items: center; gap: 0;
  padding: 14px 20px; text-align: left;
  border-bottom: 1px solid var(--line);
  background: transparent; cursor: pointer;
  transition: background .12s;
}
.hs-row:last-child { border-bottom: none; }
.hs-row:hover        { background: var(--bg-soft); }
.hs-row--active      { background: var(--accent-soft) !important; }
.hs-row--refunded    { opacity: .5; }

/* ── Row columns ── */
.hs-row { align-items: center; gap: 0; }

.hs-col-no {
  width: 84px; flex-shrink: 0; padding-right: 12px;
}
.hs-orderno {
  font-family: var(--font-en); font-size: 13px; font-weight: 700;
  color: var(--ink); white-space: nowrap;
}

.hs-col-time {
  width: 64px; flex-shrink: 0; padding-right: 16px;
  display: flex; flex-direction: column; gap: 1px;
}
.hs-time { font-family: var(--font-en); font-size: 13px; font-weight: 600; color: var(--ink-2); }
.hs-date { font-family: var(--font-en); font-size: 11px; color: var(--warn); font-weight: 500; }

.hs-col-items {
  flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0;
}
.hs-item-line { font-size: 13px; color: var(--ink-2); }
.hs-item-line em {
  font-style: normal; color: var(--ink-3);
  font-family: var(--font-en); font-size: 11.5px; margin-left: 2px;
}

.hs-col-right {
  display: flex; align-items: center; gap: 12px;
  flex-shrink: 0; margin-left: 16px;
}
.hs-pay-badge {
  font-size: 11px; font-weight: 500;
  padding: 3px 11px; border-radius: 20px;
  background: var(--bg-soft); color: var(--ink-2);
  border: 1px solid var(--line-2); white-space: nowrap;
}
.hs-pay-badge--refund { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
.hs-amount {
  font-family: var(--font-en); font-size: 15px; font-weight: 700;
  color: var(--ink); min-width: 52px; text-align: right;
}
.hs-amount--zero { text-decoration: line-through; color: var(--ink-3); }

/* ── Detail panel ── */
.hs-detail {
  background: var(--bg-card); border: 1px solid var(--line);
  border-radius: var(--radius); overflow-y: auto;
  display: flex; flex-direction: column;
}

.hs-detail-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; height: 100%; gap: 4px;
  color: var(--ink-3);
}
.hs-detail-empty-icon { font-size: 28px; opacity: .25; margin-bottom: 6px; }
.hs-detail-empty p    { margin: 0; font-size: 13px; font-weight: 600; color: var(--ink-2); }
.hs-detail-empty span { font-size: 11px; }

.hs-detail-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--line);
  flex-shrink: 0;
}
.hs-detail-orderno { font-family: var(--font-en); font-size: 17px; font-weight: 800; color: var(--ink); }
.hs-detail-ts      { font-family: var(--font-en); font-size: 11px; color: var(--ink-3); margin-top: 3px; }

.hs-status-badge { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
.badge--ok     { background: var(--accent-soft); color: var(--accent-2); }
.badge--refund { background: #fee2e2; color: #991b1b; }

.hs-detail-items {
  flex: 1; overflow-y: auto;
  padding: 12px 20px; display: flex; flex-direction: column; gap: 0;
}
.hs-detail-item {
  padding: 11px 0;
  border-bottom: 1px solid var(--line);
}
.hs-detail-item:last-child { border-bottom: none; }

.hs-di-top {
  display: flex; align-items: baseline; gap: 6px; margin-bottom: 5px;
}
.hs-di-name  { font-size: 13.5px; font-weight: 600; color: var(--ink); flex: 1; }
.hs-di-qty   { font-size: 12px; color: var(--ink-3); font-family: var(--font-en); }
.hs-di-price { font-family: var(--font-en); font-size: 13px; font-weight: 700; color: var(--ink); }

.hs-di-mods {
  display: flex; flex-direction: column; gap: 2px;
}
.hs-di-mods span { font-size: 11.5px; color: var(--ink-3); }
.hs-di-note      { color: var(--warn) !important; }

.hs-detail-footer {
  border-top: 1px solid var(--line);
  padding: 14px 20px 18px; flex-shrink: 0;
  display: flex; flex-direction: column; gap: 6px;
}
.hs-footer-row {
  display: flex; justify-content: space-between;
  font-size: 12.5px; color: var(--ink-2);
}
.hs-footer-total {
  font-size: 16px; font-weight: 800; color: var(--ink);
  padding-top: 6px; border-top: 1px solid var(--line);
  font-family: var(--font-en);
}

.hs-refund-btn {
  margin-top: 8px; width: 100%; padding: 11px;
  border-radius: var(--radius-sm);
  background: #fff1f1; color: #b91c1c;
  border: 1.5px solid #fca5a5; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: background .14s;
}
.hs-refund-btn:hover { background: #fee2e2; }

.hs-refunded-note {
  margin-top: 8px; text-align: center;
  font-size: 11.5px; color: var(--ink-3);
  padding: 8px; background: var(--bg-soft); border-radius: var(--radius-sm);
}
</style>
