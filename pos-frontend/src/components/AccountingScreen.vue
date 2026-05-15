<script setup>
import { ref, computed, watch } from 'vue'
import {
  fetchPurchases, createPurchase, updatePurchase, deletePurchase,
  fetchExpenses,  createExpense,  updateExpense,  deleteExpense,
} from '../api/index.js'

// ── 月份選擇 ────────────────────────────────────────────────────────
const now = new Date()
const currentMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

// ── Tab ─────────────────────────────────────────────────────────────
const tab = ref('purchase')  // 'purchase' | 'expense'

// ── 資料 ────────────────────────────────────────────────────────────
const purchases = ref([])
const expenses  = ref([])
const loading   = ref(false)

async function loadData() {
  loading.value = true
  try {
    const [p, e] = await Promise.all([
      fetchPurchases({ month: currentMonth.value }),
      fetchExpenses({ month: currentMonth.value }),
    ])
    purchases.value = p
    expenses.value  = e
  } catch (err) {
    console.error('loadData 失敗：', err?.response?.data || err.message)
    alert('讀取失敗：' + (err?.response?.data?.error || err.message))
  } finally {
    loading.value = false
  }
}

watch(currentMonth, loadData, { immediate: true })

// ── 統計 ────────────────────────────────────────────────────────────
const totalPurchase = computed(() => purchases.value.reduce((s, p) => s + p.total, 0))
const totalExpense  = computed(() => expenses.value.reduce((s, e) => s + e.amount, 0))
const totalCost     = computed(() => totalPurchase.value + totalExpense.value)

// ── 選中項目 ─────────────────────────────────────────────────────────
const selected = ref(null)

function selectItem(item) {
  selected.value = (selected.value?._id === item._id) ? null : item
}

// ── 日期格式 ─────────────────────────────────────────────────────────
function fmtDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ── 新增/編輯彈窗 ────────────────────────────────────────────────────
const showModal = ref(false)
const editTarget = ref(null)   // null = 新增，否則為既有資料

// 進貨表單
const pForm = ref(newPurchaseForm())
function newPurchaseForm() {
  return {
    date: todayStr(),
    supplier: '',
    note: '',
    items: [{ name: '', qty: 1, unit: '包', unitCost: 0, total: 0 }],
  }
}

// 費用表單
const eForm = ref(newExpenseForm())
function newExpenseForm() {
  return { date: todayStr(), category: '其他', amount: 0, desc: '', receipt: '' }
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function openAdd() {
  editTarget.value = null
  if (tab.value === 'purchase') pForm.value = newPurchaseForm()
  else eForm.value = newExpenseForm()
  showModal.value = true
}

function openEdit(item) {
  editTarget.value = item
  if (tab.value === 'purchase') {
    const d = new Date(item.date)
    pForm.value = {
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      supplier: item.supplier,
      note: item.note,
      items: item.items.map(i => ({ ...i })),
    }
  } else {
    const d = new Date(item.date)
    eForm.value = {
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
      category: item.category,
      amount: item.amount,
      desc: item.desc,
      receipt: item.receipt,
    }
  }
  showModal.value = true
}

// 進貨品項 helpers
function addPItem() {
  pForm.value.items.push({ name: '', qty: 1, unit: '包', unitCost: 0, total: 0 })
}
function removePItem(i) {
  pForm.value.items.splice(i, 1)
}
function recalcPItem(i) {
  const it = pForm.value.items[i]
  it.total = +(it.qty * it.unitCost).toFixed(0)
}
const pFormTotal = computed(() => pForm.value.items.reduce((s, i) => s + (i.total || 0), 0))

// 送出
async function submitModal() {
  try {
    if (tab.value === 'purchase') {
      const payload = { ...pForm.value, total: pFormTotal.value }
      if (editTarget.value) {
        const updated = await updatePurchase(editTarget.value._id, payload)
        purchases.value = purchases.value.map(p => p._id === updated._id ? updated : p)
        if (selected.value?._id === updated._id) selected.value = updated
      } else {
        const created = await createPurchase(payload)
        purchases.value = [created, ...purchases.value]
      }
    } else {
      const payload = { ...eForm.value }
      if (editTarget.value) {
        const updated = await updateExpense(editTarget.value._id, payload)
        expenses.value = expenses.value.map(e => e._id === updated._id ? updated : e)
        if (selected.value?._id === updated._id) selected.value = updated
      } else {
        const created = await createExpense(payload)
        expenses.value = [created, ...expenses.value]
      }
    }
    showModal.value = false
  } catch (err) {
    alert('儲存失敗：' + (err?.response?.data?.error || err.message))
  }
}

// 刪除
async function deleteItem(item) {
  if (!confirm('確定刪除此筆記錄？')) return
  if (tab.value === 'purchase') {
    await deletePurchase(item._id)
    purchases.value = purchases.value.filter(p => p._id !== item._id)
  } else {
    await deleteExpense(item._id)
    expenses.value = expenses.value.filter(e => e._id !== item._id)
  }
  if (selected.value?._id === item._id) selected.value = null
}

const EXPENSE_CATS = ['水電', '租金', '人事', '耗材', '其他']
</script>

<template>
  <div class="ac-screen">

    <!-- ── 左欄 ── -->
    <div class="ac-left">

      <!-- 標題列 -->
      <div class="ac-header">
        <div class="ac-tabs">
          <button class="ac-tab" :class="{ active: tab === 'purchase' }" @click="tab = 'purchase'; selected = null">進貨</button>
          <button class="ac-tab" :class="{ active: tab === 'expense'  }" @click="tab = 'expense';  selected = null">費用</button>
        </div>

        <input type="month" class="ac-month" v-model="currentMonth" />

        <button class="ac-btn-add" @click="openAdd">＋ 新增</button>
      </div>

      <!-- 統計列 -->
      <div class="ac-stats">
        <div class="ac-stat">
          <div class="ac-stat-label">本月進貨</div>
          <div class="ac-stat-val">${{ totalPurchase.toLocaleString() }}</div>
        </div>
        <div class="ac-stat">
          <div class="ac-stat-label">本月費用</div>
          <div class="ac-stat-val">${{ totalExpense.toLocaleString() }}</div>
        </div>
        <div class="ac-stat ac-stat-total">
          <div class="ac-stat-label">合計支出</div>
          <div class="ac-stat-val">${{ totalCost.toLocaleString() }}</div>
        </div>
      </div>

      <!-- 清單 -->
      <div class="ac-list" v-if="!loading">

        <!-- 進貨清單 -->
        <template v-if="tab === 'purchase'">
          <div v-if="purchases.length === 0" class="ac-empty">本月無進貨紀錄</div>
          <div
            v-for="p in purchases" :key="p._id"
            class="ac-row"
            :class="{ selected: selected?._id === p._id }"
            @click="selectItem(p)"
          >
            <div class="ac-row-date">{{ fmtDate(p.date) }}</div>
            <div class="ac-row-main">
              <div class="ac-row-title">{{ p.supplier || '（無供應商）' }}</div>
              <div class="ac-row-sub">{{ p.items.length }} 項食材</div>
            </div>
            <div class="ac-row-amount">${{ p.total.toLocaleString() }}</div>
          </div>
        </template>

        <!-- 費用清單 -->
        <template v-else>
          <div v-if="expenses.length === 0" class="ac-empty">本月無費用紀錄</div>
          <div
            v-for="e in expenses" :key="e._id"
            class="ac-row"
            :class="{ selected: selected?._id === e._id }"
            @click="selectItem(e)"
          >
            <div class="ac-row-date">{{ fmtDate(e.date) }}</div>
            <div class="ac-row-main">
              <div class="ac-row-title">{{ e.desc || '（無說明）' }}</div>
              <div class="ac-row-sub">{{ e.category }}</div>
            </div>
            <div class="ac-row-amount">${{ e.amount.toLocaleString() }}</div>
          </div>
        </template>

      </div>
      <div v-else class="ac-empty">載入中…</div>
    </div>

    <!-- ── 右欄：明細 ── -->
    <div class="ac-right">
      <div v-if="!selected" class="ac-no-select">
        <div class="ac-no-select-icon">☰</div>
        <div>選擇左側項目查看明細</div>
      </div>

      <template v-else>
        <div class="ac-detail">
          <div class="ac-detail-header">
            <div class="ac-detail-date">{{ fmtDate(selected.date) }}</div>
            <div class="ac-detail-actions">
              <button class="ac-btn-edit" @click="openEdit(selected)">編輯</button>
              <button class="ac-btn-del"  @click="deleteItem(selected)">刪除</button>
            </div>
          </div>

          <!-- 進貨明細 -->
          <template v-if="tab === 'purchase'">
            <div class="ac-detail-field">
              <span class="ac-detail-label">供應商</span>
              <span>{{ selected.supplier || '—' }}</span>
            </div>
            <div class="ac-detail-field" v-if="selected.note">
              <span class="ac-detail-label">備注</span>
              <span>{{ selected.note }}</span>
            </div>

            <div class="ac-items-table">
              <div class="ac-items-head">
                <span>品名</span><span>數量</span><span>單位</span><span>單價</span><span>小計</span>
              </div>
              <div class="ac-items-row" v-for="(it, i) in selected.items" :key="i">
                <span>{{ it.name }}</span>
                <span>{{ it.qty }}</span>
                <span>{{ it.unit }}</span>
                <span>${{ it.unitCost }}</span>
                <span>${{ it.total.toLocaleString() }}</span>
              </div>
            </div>

            <div class="ac-detail-total">合計 ${{ selected.total.toLocaleString() }}</div>
          </template>

          <!-- 費用明細 -->
          <template v-else>
            <div class="ac-detail-field">
              <span class="ac-detail-label">類別</span>
              <span class="ac-cat-badge">{{ selected.category }}</span>
            </div>
            <div class="ac-detail-field">
              <span class="ac-detail-label">說明</span>
              <span>{{ selected.desc || '—' }}</span>
            </div>
            <div class="ac-detail-field" v-if="selected.receipt">
              <span class="ac-detail-label">收據編號</span>
              <span>{{ selected.receipt }}</span>
            </div>
            <div class="ac-detail-total">金額 ${{ selected.amount.toLocaleString() }}</div>
          </template>
        </div>
      </template>
    </div>

    <!-- ── 新增/編輯 Modal ── -->
    <div class="ac-modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="ac-modal">
        <div class="ac-modal-title">{{ editTarget ? '編輯' : '新增' }}{{ tab === 'purchase' ? '進貨' : '費用' }}</div>

        <!-- 進貨表單 -->
        <template v-if="tab === 'purchase'">
          <div class="ac-form-row">
            <label>日期</label>
            <input type="date" v-model="pForm.date" />
          </div>
          <div class="ac-form-row">
            <label>供應商</label>
            <input type="text" v-model="pForm.supplier" placeholder="選填" />
          </div>
          <div class="ac-form-row">
            <label>備注</label>
            <input type="text" v-model="pForm.note" placeholder="選填" />
          </div>

          <div class="ac-form-label">品項</div>
          <div class="ac-pitems-head">
            <span>品名</span><span>數量</span><span>單位</span><span>單價</span><span>小計</span><span></span>
          </div>
          <div class="ac-pitems">
            <div class="ac-pitem" v-for="(it, i) in pForm.items" :key="i">
              <input class="ac-pi-name" type="text"   v-model="it.name"     placeholder="品名" />
              <input class="ac-pi-num"  type="number" v-model.number="it.qty"     min="1" @input="recalcPItem(i)" />
              <input class="ac-pi-unit" type="text"   v-model="it.unit"     placeholder="單位" />
              <input class="ac-pi-num"  type="number" v-model.number="it.unitCost" min="0" @input="recalcPItem(i)" placeholder="單價" />
              <span class="ac-pi-total">${{ it.total }}</span>
              <button class="ac-pi-del" @click="removePItem(i)" v-if="pForm.items.length > 1">✕</button>
            </div>
          </div>
          <button class="ac-btn-add-item" @click="addPItem">＋ 加品項</button>
          <div class="ac-form-subtotal">合計：${{ pFormTotal.toLocaleString() }}</div>
        </template>

        <!-- 費用表單 -->
        <template v-else>
          <div class="ac-form-row">
            <label>日期</label>
            <input type="date" v-model="eForm.date" />
          </div>
          <div class="ac-form-row">
            <label>類別</label>
            <select v-model="eForm.category">
              <option v-for="c in EXPENSE_CATS" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="ac-form-row">
            <label>金額</label>
            <input type="number" v-model.number="eForm.amount" min="0" />
          </div>
          <div class="ac-form-row">
            <label>說明</label>
            <input type="text" v-model="eForm.desc" placeholder="選填" />
          </div>
          <div class="ac-form-row">
            <label>收據編號</label>
            <input type="text" v-model="eForm.receipt" placeholder="選填" />
          </div>
        </template>

        <div class="ac-modal-footer">
          <button class="ac-btn-cancel" @click="showModal = false">取消</button>
          <button class="ac-btn-submit" @click="submitModal">儲存</button>
        </div>
      </div>
    </div>

  </div>
</template>
