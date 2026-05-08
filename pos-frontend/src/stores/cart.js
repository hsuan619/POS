import { defineStore } from 'pinia';

export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: {
    total: (state) =>
      state.items.reduce((sum, i) => sum + i.price * i.qty, 0),
  },
  actions: {
    addItem(product) {
      const found = this.items.find(i => i._id === product._id);
      found ? found.qty++ : this.items.push({ ...product, qty: 1 });
    },
    removeItem(id) {
      this.items = this.items.filter(i => i._id !== id);
    },
    clearCart() { this.items = []; },
  },
});