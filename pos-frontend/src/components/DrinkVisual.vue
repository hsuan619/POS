<script setup>
const props = defineProps({
  product: { type: Object, required: true },
  size:    { type: String, default: 'card' }, // 'mini' | 'card' | 'modal'
})

const px = { mini: 56, card: 110, modal: 140 }
</script>

<template>
  <div class="drink-visual" :style="{ width: px[size] + 'px', height: px[size] + 'px' }">
    <svg :viewBox="`0 0 100 100`" :width="px[size]" :height="px[size]">
      <defs>
        <linearGradient :id="`g-${product.id}`" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   :stop-color="product.color" stop-opacity="0.9" />
          <stop offset="100%" :stop-color="product.color" stop-opacity="1"   />
        </linearGradient>
      </defs>
      <!-- bowl outer -->
      <path d="M14 48 Q50 38 86 48 L78 84 Q50 92 22 84 Z"
            fill="#fff" stroke="rgba(0,0,0,0.12)" stroke-width="0.7" />
      <!-- contents fill -->
      <ellipse cx="50" cy="49" rx="34" ry="7" :fill="`url(#g-${product.id})`" />
      <path d="M16.5 49 Q50 56 83.5 49 L77 76 Q50 82 23 76 Z"
            :fill="`url(#g-${product.id})`" opacity="0.95" />
      <!-- topping dots -->
      <circle cx="40" cy="50" r="3"   fill="rgba(255,255,255,0.4)" />
      <circle cx="55" cy="48" r="2.4" fill="rgba(255,255,255,0.3)" />
      <circle cx="62" cy="52" r="2"   fill="rgba(0,0,0,0.18)" />
      <circle cx="46" cy="54" r="1.6" fill="rgba(0,0,0,0.15)" />
      <!-- shadow -->
      <ellipse cx="50" cy="86" rx="30" ry="3" fill="rgba(0,0,0,0.08)" />
    </svg>
  </div>
</template>
