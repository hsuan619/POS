<script setup>
import { ref, computed, watch } from 'vue'
import DrinkVisual from './DrinkVisual.vue'

const props = defineProps({
  products:   { type: Array, required: true },
  categories: { type: Array, required: true },
})
const emit = defineEmits(['update:products'])

const filter  = ref('all')
const search  = ref('')
const editing = ref(null)   // null | product (with optional isNew flag)
const draft   = ref(null)

const COLOR_PALETTE = [
  '#7a3f1f','#7d8c4a','#a8a558','#b67e3a','#caa479','#5b3320','#b9a4cf',
  '#5e7e3f','#e8a23a','#cbd06b','#d4546a','#e16a55','#7a4a26','#d486a0',
  '#3d2417','#2c1810','#a47551','#e0d4b8',
]

const filtered = computed(() =>
  props.products.filter(p => {
    if (filter.value !== 'all' && p.cat !== filter.value) return false
    if (search.value && !p.name.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
)

function catCount(catId) {
  return props.products.filter(p => p.cat === catId).length
}

function catName(catId) {
  return props.categories.find(c => c.id === catId)?.name ?? catId
}

function openNew() {
  editing.value = {
    isNew: true,
    id: 'p' + Math.random().toString(36).slice(2, 7),
    name: '', en: '',
    cat: props.categories[0].id,
    price: 50,
    color: '#caa479',
    desc: '',
    note: '',
    modifierProfile: { selectCount: 0, upgradeBoba: false, bobaCount: 0 },
  }
}

function openEdit(p) {
  editing.value = p
}

watch(editing, p => {
  draft.value = p ? { ...p } : null
})

function setDraft(key, val) {
  draft.value = { ...draft.value, [key]: val }
}

function setModProf(key, val) {
  draft.value = { ...draft.value, modifierProfile: { ...draft.value.modifierProfile, [key]: val } }
}

function copyModProf(productId) {
  if (!productId) return
  const src = props.products.find(p => p.id === productId)
  if (src?.modifierProfile) setDraft('modifierProfile', { ...src.modifierProfile })
}

function handleSave() {
  const exists = props.products.find(x => x.id === draft.value.id)
  const updated = exists
    ? props.products.map(x => x.id === draft.value.id ? draft.value : x)
    : [...props.products, draft.value]
  emit('update:products', updated)
  editing.value = null
}

function handleDelete(id) {
  emit('update:products', props.products.filter(x => x.id !== id))
  editing.value = null
}
</script>

<template>
  <div class="admin-screen">

    <!-- ── Header ── -->
    <header class="admin-header">
      <div>
        <h1>商品管理</h1>
        <p class="admin-sub">管理菜單上的品項、價格與分類</p>
      </div>
      <div class="admin-actions">
        <div class="menu-search admin-search">
          <span class="search-icon">⌕</span>
          <input v-model="search" placeholder="搜尋商品…" />
        </div>
        <button class="btn-primary" @click="openNew">＋ 新增商品</button>
      </div>
    </header>

    <!-- ── Filter pills ── -->
    <div class="filter-pills">
      <button class="filter-pill" :class="{ active: filter === 'all' }" @click="filter = 'all'">
        全部 <span>{{ products.length }}</span>
      </button>
      <button
        v-for="c in categories" :key="c.id"
        class="filter-pill" :class="{ active: filter === c.id }"
        @click="filter = c.id"
      >{{ c.name }} <span>{{ catCount(c.id) }}</span></button>
    </div>

    <!-- ── Table ── -->
    <div class="prod-table">
      <div class="prod-row prod-head">
        <div class="prod-c-img"></div>
        <div>商品名稱</div>
        <div>分類</div>
        <div>售價</div>
        <div>描述</div>
        <div class="prod-c-act"></div>
      </div>

      <div class="prod-body">
        <div v-for="p in filtered" :key="p.id" class="prod-row" @click="openEdit(p)">
          <div class="prod-c-img"><DrinkVisual :product="p" size="mini" /></div>
          <div>
            <div class="prod-name">{{ p.name }}</div>
            <div class="prod-en">{{ p.en }}</div>
          </div>
          <div><span class="badge badge-neutral">{{ catName(p.cat) }}</span></div>
          <div class="prod-c-price">${{ p.price }}</div>
          <div class="prod-c-desc">{{ p.desc }}</div>
          <div class="prod-c-act">
            <button class="btn-ghost-sm" @click.stop="openEdit(p)">編輯</button>
          </div>
        </div>

        <div v-if="filtered.length === 0" class="empty">
          <div class="empty-icon">∅</div>
          <div class="empty-title">沒有符合的商品</div>
        </div>
      </div>
    </div>

    <!-- ── Editor modal ── -->
    <div v-if="editing && draft" class="modal-backdrop" @click="editing = null">
      <div class="edit-modal" @click.stop>

        <header class="edit-head">
          <h2>{{ editing.isNew ? '新增商品' : '編輯商品' }}</h2>
          <button class="modal-close" style="position:static" @click="editing = null">×</button>
        </header>

        <div class="edit-body">
          <!-- Live preview -->
          <div class="edit-preview">
            <DrinkVisual :product="draft" size="modal" />
            <div class="edit-preview-meta">
              <div class="edit-preview-name">{{ draft.name || '未命名品項' }}</div>
              <div class="edit-preview-price">${{ draft.price }}</div>
            </div>
          </div>

          <!-- Form -->
          <div class="edit-form">
            <label class="field">
              <span class="field-label">商品名稱（中）</span>
              <input :value="draft.name" @input="setDraft('name', $event.target.value)" placeholder="例如：招牌湯圓紅豆湯" />
            </label>
            <label class="field">
              <span class="field-label">商品名稱（英）</span>
              <input :value="draft.en" @input="setDraft('en', $event.target.value)" placeholder="Signature Red Bean Soup" />
            </label>
            <div class="field-row">
              <label class="field">
                <span class="field-label">分類</span>
                <select :value="draft.cat" @change="setDraft('cat', $event.target.value)">
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </label>
              <label class="field">
                <span class="field-label">售價</span>
                <div class="price-input">
                  <span>$</span>
                  <input type="number" :value="draft.price" @input="setDraft('price', +$event.target.value)" />
                </div>
              </label>
            </div>
            <label class="field">
              <span class="field-label">描述</span>
              <textarea :value="draft.desc" @input="setDraft('desc', $event.target.value)" rows="2" placeholder="食材、風味、賣點…" />
            </label>
            <label class="field">
              <span class="field-label">備註提示</span>
              <input :value="draft.note" @input="setDraft('note', $event.target.value)" placeholder="例如：不加冰請先告知" />
            </label>
            <label class="field">
              <span class="field-label">主視覺顏色</span>
              <div class="color-swatches">
                <button
                  v-for="c in COLOR_PALETTE" :key="c"
                  class="swatch" :class="{ active: draft.color === c }"
                  :style="{ background: c }"
                  @click="setDraft('color', c)"
                />
              </div>
            </label>

            <!-- Modifier profile -->
            <div class="field">
              <span class="field-label">修飾選項</span>
              <div class="modprof-grid">

                <!-- 複製設定自（新增時） -->
                <div v-if="editing.isNew" class="modprof-row modprof-copy">
                  <span class="modprof-label">複製設定自</span>
                  <select class="modprof-select" @change="copyModProf($event.target.value)">
                    <option value="">── 不複製 ──</option>
                    <option v-for="p in products" :key="p.id" :value="p.id">
                      {{ p.name }}（選料 {{ p.modifierProfile?.selectCount ?? 0 }} 種 · 包餡 {{ p.modifierProfile?.bobaCount ?? 0 }} 顆）
                    </option>
                  </select>
                </div>

                <!-- 選料 -->
                <div class="modprof-row">
                  <span class="modprof-label">開放選料</span>
                  <select class="modprof-select modprof-select-sm"
                    :value="(draft.modifierProfile?.selectCount ?? 0) > 0 ? 'yes' : 'no'"
                    @change="setModProf('selectCount', $event.target.value === 'no' ? 0 : Math.max(1, draft.modifierProfile?.selectCount ?? 1))"
                  >
                    <option value="no">否</option>
                    <option value="yes">是</option>
                  </select>
                  <template v-if="(draft.modifierProfile?.selectCount ?? 0) > 0">
                    <span class="modprof-sep">可選</span>
                    <input type="number" class="modprof-num" min="1" max="10"
                      :value="draft.modifierProfile?.selectCount ?? 1"
                      @change="setModProf('selectCount', Math.max(1, Math.min(10, +$event.target.value || 1)))"
                    />
                    <span class="modprof-unit">種</span>
                  </template>
                </div>

                <!-- 可升級包餡湯圓（只在開放選料時顯示） -->
                <div v-if="(draft.modifierProfile?.selectCount ?? 0) > 0" class="modprof-row">
                  <span class="modprof-label">可升級包餡湯圓</span>
                  <select class="modprof-select modprof-select-sm"
                    :value="draft.modifierProfile?.upgradeBoba ? 'yes' : 'no'"
                    @change="setModProf('upgradeBoba', $event.target.value === 'yes')"
                  >
                    <option value="no">否</option>
                    <option value="yes">是（佔一個選料 slot）</option>
                  </select>
                </div>

                <!-- 包餡湯圓數量 -->
                <div class="modprof-row">
                  <span class="modprof-label">含包餡湯圓</span>
                  <input type="number" class="modprof-num" min="0" max="20"
                    :value="draft.modifierProfile?.bobaCount ?? 0"
                    @change="setModProf('bobaCount', Math.max(0, Math.min(20, +$event.target.value || 0)))"
                  />
                  <span class="modprof-unit">顆（0 = 不含）</span>
                </div>

              </div>
            </div>

          </div>
        </div>

        <footer class="edit-foot">
          <button v-if="!editing.isNew" class="btn-danger" @click="handleDelete(draft.id)">刪除商品</button>
          <div class="foot-spacer" />
          <button class="btn-ghost" @click="editing = null">取消</button>
          <button class="btn-primary" :disabled="!draft.name" @click="handleSave">儲存</button>
        </footer>

      </div>
    </div>

  </div>
</template>
