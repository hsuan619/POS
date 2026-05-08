<script setup>
import { ref } from 'vue'
import { login } from '../api/index.js'

const emit = defineEmits(['success'])

const password = ref('')
const error    = ref('')
const loading  = ref(false)

async function handleSubmit() {
  if (!password.value) return
  error.value   = ''
  loading.value = true
  try {
    await login(password.value)
    emit('success')
  } catch {
    error.value   = '密碼錯誤，請再試一次'
    password.value = ''
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="lg-backdrop">
    <div class="lg-card">
      <div class="lg-logo">
        <div class="brand-mark" style="width:56px;height:56px;font-size:26px;border-radius:14px">圓</div>
      </div>
      <div class="lg-title">巷口湯圓</div>
      <div class="lg-sub">POS 系統</div>

      <form class="lg-form" @submit.prevent="handleSubmit">
        <input
          v-model="password"
          class="lg-input"
          type="password"
          placeholder="請輸入密碼"
          autofocus
          :disabled="loading"
        />
        <div v-if="error" class="lg-error">{{ error }}</div>
        <button class="lg-btn" type="submit" :disabled="loading || !password">
          {{ loading ? '驗證中…' : '登入' }}
        </button>
      </form>
    </div>
  </div>
</template>
