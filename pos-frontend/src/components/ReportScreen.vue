<script setup>
import { ref, computed } from 'vue'
import * as XLSX from 'xlsx'
import { fetchDailyDetail, fetchMonthlyReport, fetchQuarterlyReport } from '../api/index.js'

const type = ref('daily')

const now = new Date()
function pad(n) { return String(n).padStart(2, '0') }
const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`
const monthStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}`

const selDate    = ref(todayStr)
const selMonth   = ref(monthStr)
const selYear    = ref(String(now.getFullYear()))
const selQuarter = ref('1')

const YEARS = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i))
const QUARTERS = [
  { val: '1', label: 'Q1（1–3月）' },
  { val: '2', label: 'Q2（4–6月）' },
  { val: '3', label: 'Q3（7–9月）' },
  { val: '4', label: 'Q4（10–12月）' },
]

const report  = ref(null)
const loading = ref(false)

async function query() {
  loading.value = true
  report.value  = null
  try {
    if (type.value === 'daily') {
      report.value = await fetchDailyDetail({ date: selDate.value })
    } else if (type.value === 'monthly') {
      report.value = await fetchMonthlyReport({ month: selMonth.value })
    } else {
      report.value = await fetchQuarterlyReport({ year: selYear.value, quarter: selQuarter.value })
    }
  } catch (err) {
    alert('載入失敗：' + (err?.response?.data?.error || err.message))
  } finally {
    loading.value = false
  }
}

const qTotals = computed(() => {
  const months = report.value?.months
  if (!months) return {}
  return months.reduce((acc, m) => {
    acc.revenue   = (acc.revenue   || 0) + m.revenue
    acc.purchases = (acc.purchases || 0) + m.purchases
    acc.expenses  = (acc.expenses  || 0) + m.expenses
    acc.net       = (acc.net       || 0) + m.net
    return acc
  }, {})
})

function fmt(n) { return (n ?? 0).toLocaleString() }

function exportExcel() {
  if (!report.value) return
  const wb = XLSX.utils.book_new()

  if (type.value === 'quarterly') {
    const months = report.value.months
    const headers = ['', ...months.map(m => m.month.slice(5) + '月'), '合計']
    const tot = k => months.reduce((s, m) => s + m[k], 0)
    const rows = [
      headers,
      ['營收',    ...months.map(m => m.revenue),   tot('revenue')],
      ['進貨成本', ...months.map(m => m.purchases), tot('purchases')],
      ['其他費用', ...months.map(m => m.expenses),  tot('expenses')],
      ['淨利',    ...months.map(m => m.net),        tot('net')],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), '季度損益表')
    XLSX.writeFile(wb, `季報_${selYear.value}_Q${selQuarter.value}.xlsx`)
    return
  }

  const prodRows = [['品名', '數量', '金額'], ...report.value.products.map(p => [p._id, p.qty, p.revenue])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(prodRows), '品項銷售')

  const selRows = [['選料', '次數'], ...report.value.selects.map(s => [s._id, s.count])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(selRows), '選料統計')

  if (type.value === 'monthly') {
    const pl = report.value.summary
    const plRows = [
      ['項目', '金額'],
      ['營收',    pl.revenue],
      ['進貨成本', pl.purchases],
      ['其他費用', pl.expenses],
      ['淨利',    pl.net],
    ]
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(plRows), '損益表')
  }

  const label = type.value === 'daily' ? selDate.value : selMonth.value
  XLSX.writeFile(wb, `報表_${label}.xlsx`)
}
</script>

<template>
  <div class="rp-screen">

    <!-- ── Toolbar ── -->
    <div class="rp-toolbar">
      <div class="rp-tabs">
        <button class="rp-tab" :class="{ active: type === 'daily'   }" @click="type = 'daily';   report = null">日報</button>
        <button class="rp-tab" :class="{ active: type === 'monthly' }" @click="type = 'monthly'; report = null">月報</button>
        <button class="rp-tab" :class="{ active: type === 'quarterly'}" @click="type = 'quarterly'; report = null">季報</button>
      </div>

      <div class="rp-controls">
        <input v-if="type === 'daily'"   type="date"  v-model="selDate" />
        <input v-if="type === 'monthly'" type="month" v-model="selMonth" />
        <template v-if="type === 'quarterly'">
          <select v-model="selYear">
            <option v-for="y in YEARS" :key="y">{{ y }}</option>
          </select>
          <select v-model="selQuarter">
            <option v-for="q in QUARTERS" :key="q.val" :value="q.val">{{ q.label }}</option>
          </select>
        </template>

        <button class="rp-btn-query" @click="query">查詢</button>
        <button class="rp-btn-export" :disabled="!report" @click="exportExcel">匯出 Excel</button>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="rp-body">

      <div v-if="loading" class="rp-empty">載入中…</div>

      <div v-else-if="!report" class="rp-empty">選擇日期後點「查詢」</div>

      <!-- 日報 / 月報 共用銷售區塊 -->
      <template v-else-if="type !== 'quarterly'">

        <!-- 統計卡片 -->
        <div class="rp-stats">
          <div class="rp-stat">
            <div class="rp-stat-label">營收</div>
            <div class="rp-stat-val">${{ fmt(report.summary.revenue) }}</div>
          </div>
          <div class="rp-stat">
            <div class="rp-stat-label">完成訂單</div>
            <div class="rp-stat-val">{{ report.summary.orders }} 筆</div>
          </div>
          <template v-if="type === 'monthly'">
            <div class="rp-stat">
              <div class="rp-stat-label">進貨成本</div>
              <div class="rp-stat-val">${{ fmt(report.summary.purchases) }}</div>
            </div>
            <div class="rp-stat">
              <div class="rp-stat-label">其他費用</div>
              <div class="rp-stat-val">${{ fmt(report.summary.expenses) }}</div>
            </div>
            <div class="rp-stat">
              <div class="rp-stat-label">淨利</div>
              <div class="rp-stat-val" :class="report.summary.net >= 0 ? 'rp-pos' : 'rp-neg'">
                ${{ fmt(report.summary.net) }}
              </div>
            </div>
          </template>
        </div>

        <!-- 品項銷售排行 -->
        <div>
          <div class="rp-section-title">品項銷售排行</div>
          <div v-if="report.products.length === 0" class="rp-empty">本期無銷售資料</div>
          <table v-else class="rp-table">
            <thead>
              <tr><th>品名</th><th class="num">數量</th><th class="num">金額</th></tr>
            </thead>
            <tbody>
              <tr v-for="p in report.products" :key="p._id">
                <td>{{ p._id }}</td>
                <td class="num">{{ p.qty }}</td>
                <td class="num">${{ fmt(p.revenue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 選料統計 -->
        <div>
          <div class="rp-section-title">選料使用統計</div>
          <div v-if="report.selects.length === 0" class="rp-empty">本期無選料資料</div>
          <table v-else class="rp-table">
            <thead>
              <tr><th>選料</th><th class="num">使用次數</th></tr>
            </thead>
            <tbody>
              <tr v-for="s in report.selects" :key="s._id">
                <td>{{ s._id }}</td>
                <td class="num">{{ s.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>

      </template>

      <!-- 季報：損益表（橫向） -->
      <template v-else-if="report">
        <div class="rp-section-title">{{ selYear }} 年 Q{{ selQuarter }} 損益表</div>
        <table class="rp-table rp-table-quarterly">
          <thead>
            <tr>
              <th></th>
              <th class="num" v-for="m in report.months" :key="m.month">{{ m.month.slice(5) }}月</th>
              <th class="num">合計</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>營收</td>
              <td class="num" v-for="m in report.months" :key="m.month">${{ fmt(m.revenue) }}</td>
              <td class="num">${{ fmt(qTotals.revenue) }}</td>
            </tr>
            <tr>
              <td>進貨成本</td>
              <td class="num" v-for="m in report.months" :key="m.month">${{ fmt(m.purchases) }}</td>
              <td class="num">${{ fmt(qTotals.purchases) }}</td>
            </tr>
            <tr>
              <td>其他費用</td>
              <td class="num" v-for="m in report.months" :key="m.month">${{ fmt(m.expenses) }}</td>
              <td class="num">${{ fmt(qTotals.expenses) }}</td>
            </tr>
            <tr class="rp-tr-net">
              <td>淨利</td>
              <td class="num" v-for="m in report.months" :key="m.month"
                  :class="m.net >= 0 ? 'rp-pos' : 'rp-neg'">
                ${{ fmt(m.net) }}
              </td>
              <td class="num" :class="qTotals.net >= 0 ? 'rp-pos' : 'rp-neg'">
                ${{ fmt(qTotals.net) }}
              </td>
            </tr>
          </tbody>
        </table>
      </template>

    </div>
  </div>
</template>
