<script setup>
const props = defineProps({
  lines:     { type: Array,  required: true },
  total:     { type: Number, required: true },
  orderType: { type: String, required: true },
  payment:   { type: Object, required: true },
})
const emit = defineEmits(['done'])

const ORDER_TYPE_LABEL = { takeaway: '外帶', dinein: '內用' }
const PAY_LABEL        = { cash: '現金', card: '信用卡', linepay: 'LINE Pay', jko: '街口' }

function modSummary(line) {
  const parts = []
  if (line.selects?.length) {
    const counts = {}
    line.selects.forEach(s => { counts[s.name] = (counts[s.name] || 0) + 1 })
    parts.push('選料：' + Object.entries(counts).map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join('、'))
  }
  if (line.bobaFlavors?.length) {
    const counts = {}
    line.bobaFlavors.forEach(f => { counts[f.name] = (counts[f.name] || 0) + 1 })
    parts.push('包餡口味：' + Object.entries(counts).map(([n, c]) => c > 1 ? `${n} ×${c}` : n).join('、'))
  }
  if (line.upgradedBobas > 0) parts.push(`升級包餡湯圓 ×${line.upgradedBobas}`)
  if (line.addons?.length) {
    parts.push('加料：' + line.addons.map(a => a.qty > 1 ? `${a.name} ×${a.qty}` : a.name).join('、'))
  }
  return parts.join(' · ') || null
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('done')">
    <div class="confirm-modal" @click.stop>

      <!-- Header -->
      <header class="confirm-head">
        <div class="confirm-badge">{{ ORDER_TYPE_LABEL[orderType] }}</div>
        <h2>本單明細</h2>
        <div class="confirm-pay-label">{{ PAY_LABEL[payment.method] ?? payment.method }}</div>
      </header>

      <!-- Items list -->
      <div class="confirm-items">
        <div v-for="(line, i) in lines" :key="i" class="confirm-item">
          <div class="confirm-item-top">
            <div class="confirm-color-dot" :style="{ background: line.color }" />
            <span class="confirm-item-name">{{ line.name }}</span>
            <span class="confirm-item-qty">×{{ line.qty }}</span>
            <span class="confirm-item-price">${{ line.total }}</span>
          </div>
          <div v-if="modSummary(line)" class="confirm-item-mods">{{ modSummary(line) }}</div>
          <div v-if="line.note" class="confirm-item-note">★ {{ line.note }}</div>
        </div>
      </div>

      <!-- Total row -->
      <div class="confirm-total">
        <span>合計</span>
        <span class="confirm-total-amt">${{ total }}</span>
      </div>

      <!-- Cash change (only for cash payments) -->
      <div v-if="payment.method === 'cash' && payment.change > 0" class="confirm-change">
        找零 <strong>${{ payment.change }}</strong>
      </div>

      <!-- Done button -->
      <button class="btn-primary btn-done" @click="emit('done')">完成</button>

    </div>
  </div>
</template>
