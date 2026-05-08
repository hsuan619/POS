<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  total:     { type: Number, required: true },
  itemCount: { type: Number, required: true },
  orderType: { type: String, required: true },   // 'takeaway' | 'dinein'
})
const emit = defineEmits(['close', 'confirm'])

const ORDER_TYPE_LABEL = { takeaway: '外帶', dinein: '內用' }

const METHODS = [
  { id: 'cash',    label: '現金',     icon: '$'  },
  { id: 'card',    label: '信用卡',   icon: '▭'  },
  { id: 'linepay', label: 'LINE Pay', icon: 'L'  },
  { id: 'jko',     label: '街口',     icon: 'J'  },
]

const method    = ref('cash')
const cashGiven = ref(props.total)

const change = computed(() =>
  method.value === 'cash' ? Math.max(0, cashGiven.value - props.total) : 0
)

// Quick-pick amounts: exact total + smallest bills above it
const quickAmounts = computed(() => {
  const bills = [100, 500, 1000]
  const above = bills.filter(b => b > props.total).slice(0, 2)
  return [props.total, ...above]
})

const canConfirm = computed(() =>
  method.value !== 'cash' || cashGiven.value >= props.total
)

function confirm() {
  emit('confirm', {
    method:    method.value,
    cashGiven: cashGiven.value,
    change:    change.value,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="pay-modal" @click.stop>

      <!-- ── Header ── -->
      <div class="pay-head">
        <div>
          <div class="pay-eyebrow">結帳</div>
          <div class="pay-amount">${{ total }}</div>
          <div class="pay-sub">{{ itemCount }} 份 · {{ ORDER_TYPE_LABEL[orderType] }}</div>
        </div>
        <button class="modal-close" style="position:static" @click="$emit('close')">×</button>
      </div>

      <!-- ── Payment methods ── -->
      <div class="pay-methods">
        <button
          v-for="m in METHODS"
          :key="m.id"
          class="pay-method"
          :class="{ active: method === m.id }"
          @click="method = m.id"
        >
          <span class="pay-method-icon">{{ m.icon }}</span>
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- ── Cash panel ── -->
      <div v-if="method === 'cash'" class="pay-cash">
        <div class="pay-cash-row">
          <span>客付</span>
          <input
            type="number"
            :value="cashGiven"
            @input="cashGiven = +($event.target.value) || 0"
          />
        </div>
        <div class="pay-quick">
          <button
            v-for="amt in quickAmounts"
            :key="amt"
            @click="cashGiven = amt"
          >${{ amt }}</button>
        </div>
        <div class="pay-change">找零 <strong>${{ change }}</strong></div>
      </div>

      <!-- ── Non-cash panel ── -->
      <div v-else class="pay-other">
        <div class="pay-other-icon">⌁</div>
        <div>請於讀卡機完成感應</div>
        <div class="pay-other-sub">等待裝置回應…</div>
      </div>

      <!-- ── Confirm ── -->
      <button
        class="btn-primary btn-big"
        :disabled="!canConfirm"
        @click="confirm"
      >確認收款 ${{ total }}</button>

    </div>
  </div>
</template>
