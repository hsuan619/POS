<script setup>
import { ref, computed, watch } from 'vue'
import DrinkVisual from './DrinkVisual.vue'

const props = defineProps({
  product:     { type: Object, required: true },
  ingredients: { type: Array,  required: true },
  rules:       { type: Object, required: true },
})
const emit = defineEmits(['close', 'add'])

// ── shorthand ──────────────────────────────────────────────────────
const prof        = computed(() => props.product.modifierProfile ?? { selectCount: 0 })
const canSelect   = computed(() => prof.value.selectCount > 0)
const canUpgrade  = computed(() => canSelect.value && !!prof.value.upgradeBoba)
const regularPool = computed(() => props.ingredients.filter(i => i.group === 'regular'))
const bobaPool    = computed(() => props.ingredients.filter(i => i.group === 'boba'))

// ── 選料區 state ────────────────────────────────────────────────────
const selectHistory = ref([])
const upgradedBobas  = ref(0)
const effectiveSlots = computed(() =>
  Math.max(0, prof.value.selectCount - upgradedBobas.value)
)
const selectCounts = computed(() => {
  const c = {}
  selectHistory.value.forEach(id => { c[id] = (c[id] || 0) + 1 })
  return c
})

function addSelect(id) {
  if (effectiveSlots.value === 0) return
  const next = [...selectHistory.value, id]
  if (next.length > effectiveSlots.value) next.shift()
  selectHistory.value = next
}
function removeSelect(id) {
  const next = [...selectHistory.value]
  const idx  = next.lastIndexOf(id)
  if (idx !== -1) next.splice(idx, 1)
  selectHistory.value = next
}

// ── 升級包餡湯圓 state ──────────────────────────────────────────────
function bumpUpgrade(delta) {
  upgradedBobas.value = Math.max(
    0,
    Math.min(prof.value.selectCount, upgradedBobas.value + delta)
  )
  // Trim select history if effective slots decreased
  const max = effectiveSlots.value
  if (selectHistory.value.length > max)
    selectHistory.value = max > 0 ? selectHistory.value.slice(-max) : []
}

// ── 包餡湯圓口味 ─────────────────────────────────────────────────────
const descBobaCount = computed(() => props.product.modifierProfile?.bobaCount ?? 0)

const totalBobaSlots = computed(() => descBobaCount.value + upgradedBobas.value * 2)
const showBobaFlavor = computed(() => totalBobaSlots.value > 0)

const bobaFlavorHistory = ref([])
const bobaFlavorCounts  = computed(() => {
  const c = {}
  bobaFlavorHistory.value.forEach(id => { c[id] = (c[id] || 0) + 1 })
  return c
})

function addBobaFlavor(id) {
  const next = [...bobaFlavorHistory.value, id]
  if (next.length > totalBobaSlots.value) next.shift()
  bobaFlavorHistory.value = next
}
function removeBobaFlavor(id) {
  const next = [...bobaFlavorHistory.value]
  const idx  = next.lastIndexOf(id)
  if (idx !== -1) next.splice(idx, 1)
  bobaFlavorHistory.value = next
}

// Trim boba flavor history when totalBobaSlots decreases
watch(totalBobaSlots, max => {
  if (bobaFlavorHistory.value.length > max)
    bobaFlavorHistory.value = max > 0 ? bobaFlavorHistory.value.slice(-max) : []
})

// ── 加料區 state ────────────────────────────────────────────────────
const showAddons = ref(false)
const addons = ref({})

function bumpAddon(id, group, delta) {
  const cur    = { ...addons.value }
  const curQty = cur[id]?.qty ?? 0
  const next   = Math.max(0, curQty + delta)
  if (next === 0) delete cur[id]
  else cur[id] = { id, group, qty: next }
  addons.value = cur
}

// ── 數量 & 備註 ─────────────────────────────────────────────────────
const qty  = ref(1)
const note = ref('')

// ── 定價計算 ────────────────────────────────────────────────────────
const addonList    = computed(() => Object.values(addons.value))
const addonDelta   = computed(() =>
  addonList.value.reduce((sum, a) =>
    sum + a.qty * (a.group === 'boba' ? props.rules.addonBoba : props.rules.addonRegular), 0)
)
const upgradeDelta = computed(() => upgradedBobas.value * props.rules.upgradeBoba)
const lineUnit     = computed(() => props.product.price + addonDelta.value + upgradeDelta.value)
const lineTotal    = computed(() => lineUnit.value * qty.value)

// ── 送出 ────────────────────────────────────────────────────────────
function handleAdd() {
  const selectsList = selectHistory.value
    .map(id => {
      const ing = props.ingredients.find(i => i.id === id)
      return ing ? { id: ing.id, name: ing.name } : null
    }).filter(Boolean)

  const bobaFlavorList = bobaFlavorHistory.value
    .map(id => {
      const ing = props.ingredients.find(i => i.id === id)
      return ing ? { id: ing.id, name: ing.name } : null
    }).filter(Boolean)

  emit('add', {
    uid:           'L' + Date.now() + Math.floor(Math.random() * 1000),
    pid:           props.product.id,
    name:          props.product.name,
    color:         props.product.color,
    selects:       selectsList,
    bobaFlavors:   bobaFlavorList,
    upgradedBobas: upgradedBobas.value,
    upgradeDelta:  upgradeDelta.value,
    addons:        addonList.value.map(a => {
      const ing = props.ingredients.find(i => i.id === a.id)
      return {
        id: a.id, name: ing?.name, qty: a.qty, group: a.group,
        delta: a.qty * (a.group === 'boba' ? props.rules.addonBoba : props.rules.addonRegular),
      }
    }),
    qty:       qty.value,
    unitPrice: lineUnit.value,
    total:     lineTotal.value,
    note:      note.value,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click="$emit('close')">
    <div class="mod-modal" @click.stop>
      <button class="modal-close" @click="$emit('close')">×</button>

      <!-- ── Hero ── -->
      <div class="mod-hero">
        <DrinkVisual :product="product" size="modal" />
        <div class="mod-hero-meta">
          <div class="mod-hero-cat">{{ product.note }}</div>
          <h2 class="mod-hero-name">{{ product.name }}</h2>
          <p class="mod-hero-desc">{{ product.desc }}</p>
          <div class="mod-hero-base">基本價 <strong>${{ product.price }}</strong></div>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="mod-body">

        <!-- 選料區 -->
        <div v-if="canSelect" class="mod-group">
          <div class="mod-group-head">
            <span class="mod-group-label">選料區</span>
            <span class="mod-hint">
              {{ selectHistory.length }}/{{ effectiveSlots }} 種 · 可複選同種料
            </span>
          </div>
          <div class="opt-row">
            <div v-for="o in regularPool" :key="o.id" class="select-chip-wrap">
              <button
                class="opt-chip"
                :class="{ active: selectCounts[o.id] > 0 }"
                :disabled="effectiveSlots === 0 && !selectCounts[o.id]"
                @click="addSelect(o.id)"
              >
                <span class="opt-dot" :style="{ background: o.color }" />
                {{ o.name }}
                <button v-if="selectCounts[o.id] > 0" class="chip-dec" @click.stop="removeSelect(o.id)">×</button>
              </button>
              <span v-if="selectCounts[o.id] > 0" class="chip-badge">{{ selectCounts[o.id] }}</span>
            </div>
          </div>
          <p v-if="effectiveSlots === 0 && upgradedBobas === 0" class="slot-full-hint">
            已選滿 {{ prof.selectCount }} 種，點 × 可移除
          </p>
        </div>

        <!-- 升級包餡湯圓 -->
        <div v-if="canUpgrade" class="mod-group">
          <div class="mod-group-head">
            <span class="mod-group-label">升級包餡湯圓</span>
            <span class="mod-hint">每 1 份可選 2 種口味，+${{ rules.upgradeBoba }}</span>
          </div>
          <div class="upgrade-row">
            <div class="qty-stepper">
              <button :disabled="upgradedBobas === 0" @click="bumpUpgrade(-1)">−</button>
              <span>{{ upgradedBobas }}</span>
              <button :disabled="upgradedBobas >= prof.selectCount" @click="bumpUpgrade(+1)">＋</button>
            </div>
            <span class="upgrade-label">
              <template v-if="upgradedBobas === 0">不升級</template>
              <template v-else>
                包餡湯圓 × {{ upgradedBobas }} 份
                <span class="upgrade-cost">+${{ upgradedBobas * rules.upgradeBoba }}</span>
              </template>
            </span>
            <span v-if="upgradedBobas > 0" class="upgrade-slot-hint">剩餘選料 slot：{{ effectiveSlots }}</span>
          </div>
        </div>

        <!-- 包餡湯圓口味 -->
        <div v-if="showBobaFlavor" class="mod-group">
          <div class="mod-group-head">
            <span class="mod-group-label">包餡湯圓口味</span>
            <span class="mod-hint">
              {{ bobaFlavorHistory.length }}/{{ totalBobaSlots }} 顆 · 可複選
            </span>
          </div>
          <div class="opt-row">
            <div v-for="o in bobaPool" :key="o.id" class="select-chip-wrap">
              <button
                class="opt-chip"
                :class="{ active: bobaFlavorCounts[o.id] > 0 }"
                :disabled="bobaFlavorHistory.length >= totalBobaSlots && !bobaFlavorCounts[o.id]"
                @click="addBobaFlavor(o.id)"
              >
                <span class="opt-dot" :style="{ background: o.color }" />
                {{ o.name }}
                <button v-if="bobaFlavorCounts[o.id] > 0" class="chip-dec" @click.stop="removeBobaFlavor(o.id)">×</button>
              </button>
              <span v-if="bobaFlavorCounts[o.id] > 0" class="chip-badge">{{ bobaFlavorCounts[o.id] }}</span>
            </div>
          </div>
          <p v-if="bobaFlavorHistory.length >= totalBobaSlots" class="slot-full-hint">
            已選滿 {{ totalBobaSlots }} 顆口味，點 × 可移除
          </p>
        </div>

        <!-- 加料區（摺疊） -->
        <div class="mod-group">
          <button class="mod-group-toggle" @click="showAddons = !showAddons">
            <span class="mod-group-label">加料區</span>
            <span class="mod-hint addon-hint">
              一般 +${{ rules.addonRegular }}/份 · 包餡湯圓 +${{ rules.addonBoba }}/份
            </span>
            <span class="toggle-arrow" :class="{ open: showAddons }">▾</span>
          </button>

          <template v-if="showAddons">
            <div class="addon-grid">
              <div
                v-for="o in regularPool" :key="o.id"
                class="addon-row" :class="{ active: (addons[o.id]?.qty ?? 0) > 0 }"
              >
                <span class="addon-dot" :style="{ background: o.color }" />
                <div class="addon-meta">
                  <span class="addon-name">{{ o.name }}</span>
                  <span class="addon-delta">+${{ rules.addonRegular }}</span>
                </div>
                <div class="addon-qty">
                  <button :disabled="!(addons[o.id]?.qty)" @click="bumpAddon(o.id, 'regular', -1)">−</button>
                  <span>{{ addons[o.id]?.qty ?? 0 }}</span>
                  <button @click="bumpAddon(o.id, 'regular', +1)">＋</button>
                </div>
              </div>
            </div>
            <div class="addon-divider"><span>包餡湯圓</span></div>
            <div class="addon-grid">
              <div
                v-for="o in bobaPool" :key="o.id"
                class="addon-row" :class="{ active: (addons[o.id]?.qty ?? 0) > 0 }"
              >
                <span class="addon-dot" :style="{ background: o.color }" />
                <div class="addon-meta">
                  <span class="addon-name">{{ o.name }}</span>
                  <span class="addon-delta">+${{ rules.addonBoba }} / 2 顆</span>
                </div>
                <div class="addon-qty">
                  <button :disabled="!(addons[o.id]?.qty)" @click="bumpAddon(o.id, 'boba', -1)">−</button>
                  <span>{{ addons[o.id]?.qty ?? 0 }}</span>
                  <button @click="bumpAddon(o.id, 'boba', +1)">＋</button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- 備註 -->
        <div class="mod-group">
          <div class="mod-group-head">
            <span class="mod-group-label">備註</span>
          </div>
          <input v-model="note" class="mod-note" placeholder="例如：不加冰、少甜" />
        </div>

      </div><!-- /mod-body -->

      <!-- ── Footer ── -->
      <div class="mod-footer">
        <div class="qty-stepper">
          <button @click="qty = Math.max(1, qty - 1)">−</button>
          <span>{{ qty }}</span>
          <button @click="qty = Math.min(20, qty + 1)">＋</button>
        </div>
        <div class="mod-foot-total">
          <span class="foot-total-label">小計</span>
          <span class="foot-total-val">${{ lineTotal }}</span>
        </div>
        <button class="btn-primary btn-big" @click="handleAdd">加入訂單</button>
      </div>

    </div>
  </div>
</template>

