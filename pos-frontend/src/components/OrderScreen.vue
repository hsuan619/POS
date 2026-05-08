<script setup>
import { ref, computed } from 'vue'
import DrinkVisual from './DrinkVisual.vue'
import ModifierModal from './ModifierModal.vue'
import CartPane from './CartPane.vue'

const props = defineProps({
  products:    { type: Array, required: true },
  categories:  { type: Array, required: true },
  ingredients: { type: Array, required: true },
  rules:       { type: Object, required: true },
  cardSize:    { type: String, default: 'large' }, // 'small' | 'medium' | 'large'
})

const emit = defineEmits(['checkout'])

const cart = ref([])

const activeCat = ref('all')
const search    = ref('')
const picking   = ref(null)   // product being configured in modal

const filtered = computed(() =>
  props.products.filter(p => {
    if (activeCat.value !== 'all' && p.cat !== activeCat.value) return false
    if (search.value && !p.name.includes(search.value)) return false
    return true
  })
)

const cardCols = computed(() =>
  props.cardSize === 'small' ? 4 : props.cardSize === 'large' ? 2 : 3
)

function countByCat(catId) {
  return props.products.filter(p => p.cat === catId).length
}

function addToCart(line) {
  cart.value = [...cart.value, line]
  picking.value = null
}

function updateCart(newCart) {
  cart.value = newCart
}

async function handleCheckout(payload) {
  await emit('checkout', payload)
  cart.value = []
}
</script>

<template>
  <div class="order-screen">
    <!-- ── Left: menu pane ── -->
    <section class="menu-pane">
      <header class="menu-header">
        <div class="menu-title">
          <h1>菜單</h1>
          <span class="menu-count">{{ filtered.length }} 項商品</span>
        </div>
        <div class="menu-search">
          <span class="search-icon">⌕</span>
          <input v-model="search" placeholder="搜尋品項…" />
        </div>
      </header>

      <!-- Category tabs -->
      <nav class="cat-tabs">
        <button
          class="cat-tab"
          :class="{ active: activeCat === 'all' }"
          @click="activeCat = 'all'"
        >
          全部 <span class="cat-count">{{ products.length }}</span>
        </button>
        <button
          v-for="c in categories"
          :key="c.id"
          class="cat-tab"
          :class="{ active: activeCat === c.id }"
          @click="activeCat = c.id"
        >
          {{ c.name }} <span class="cat-count">{{ countByCat(c.id) }}</span>
        </button>
      </nav>

      <!-- Product grid -->
      <div class="menu-grid" :class="`menu-cols-${cardCols}`">
        <button
          v-for="p in filtered"
          :key="p.id"
          class="drink-card"
          @click="picking = p"
        >
          <DrinkVisual :product="p" :size="cardSize === 'small' ? 'mini' : 'card'" />
          <div class="drink-meta">
            <div class="drink-name-row">
              <span class="drink-name">{{ p.name }}</span>
            </div>
            <div v-if="p.desc" class="drink-en">{{ p.desc }}</div>
            <div class="drink-bottom">
              <span class="drink-price">
                <span class="price-currency">$</span>
                <span class="price-num">{{ p.price }}</span>
              </span>
              <span class="drink-add">＋</span>
            </div>
          </div>
        </button>

        <div v-if="filtered.length === 0" class="empty">
          <div class="empty-icon">∅</div>
          <div class="empty-title">找不到品項</div>
          <div class="empty-hint">試試其他關鍵字</div>
        </div>
      </div>
    </section>

    <!-- ── Right: cart ── -->
    <CartPane
      :cart="cart"
      @update:cart="updateCart"
      @checkout="handleCheckout"
    />

    <!-- Modifier modal -->
    <ModifierModal
      v-if="picking"
      :product="picking"
      :ingredients="ingredients"
      :rules="rules"
      @close="picking = null"
      @add="addToCart"
    />
  </div>
</template>
