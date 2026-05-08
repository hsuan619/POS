# 巷口湯圓 POS 系統

## 專案結構

```
D:\project\pos\
├── pos-frontend/    # Vue 3 + Vite + Tailwind CSS v4
└── pos-backend/     # Express 5 + Mongoose 9 + MongoDB Atlas
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3 (Composition API, `<script setup>`) |
| 建置工具 | Vite 8 |
| 樣式 | 全域 `src/style.css`（CSS 變數 + 各元件 prefix class） |
| 後端框架 | Express 5 |
| ODM | Mongoose 9 |
| 資料庫 | MongoDB Atlas |
| HTTP client | Axios |
| Excel 匯出 | SheetJS (`xlsx`)，前端純客戶端產生 |

## 啟動方式

```bash
# 後端（port 3000）
cd pos-backend && npm run dev

# 前端（port 5173）
cd pos-frontend && npm run dev
```

---

## 前端架構

### 畫面切換

`App.vue` 以 `view` ref 控制五個畫面，無 router：

| view | 元件 | 功能 |
|------|------|------|
| `order` | `OrderScreen.vue` | 點餐主畫面 |
| `history` | `HistoryScreen.vue` | 今日訂單記錄與退款 |
| `report` | `ReportScreen.vue` | 日報 / 月報 / 季報，支援匯出 Excel |
| `products` | `ProductsScreen.vue` | 商品管理 |
| `accounting` | `AccountingScreen.vue` | 進貨與費用記錄 |

### 元件樹

```
App.vue
├── OrderScreen.vue
│   ├── DrinkVisual.vue       # SVG 商品視覺
│   ├── ModifierModal.vue     # 選料/加料選擇彈窗
│   └── CartPane.vue
│       ├── PaymentModal.vue
│       └── OrderConfirmModal.vue
├── HistoryScreen.vue
├── ReportScreen.vue
├── ProductsScreen.vue
└── AccountingScreen.vue
```

### 狀態管理

- `App.vue` 持有 `products`、`orders` ref，透過 props 向下傳遞
- `AccountingScreen`、`ReportScreen` 各自獨立向後端 fetch，不走 App.vue
- `src/stores/` 內有 `cart.js`、`product.js` 但目前**未使用**
- 訂單寫入後端後 prepend 到 `orders` 陣列（不重新 fetch）

### 樣式規範

所有元件的樣式統一放在 `src/style.css`，不使用 `<style scoped>`。
各元件以唯一 prefix 區隔：

| Prefix | 元件 |
|--------|------|
| `ac-` | AccountingScreen |
| `hs-` | HistoryScreen |
| `rp-` | ReportScreen |
| `mod-` | ModifierModal |

CSS 變數（定義在 `:root`）：
`--bg`、`--bg-card`、`--bg-soft`、`--ink`、`--ink-2`、`--ink-3`、`--accent`、`--line`

### 靜態資料（`src/data/seed.js`）

- `CATEGORIES` — redbean / grass / ice / winter
- `INGREDIENTS` — regular（一般選料）/ boba（包餡湯圓）
- `MODIFIER_RULES` — addonRegular: 10 / addonBoba: 15 / upgradeBoba: 5

商品與訂單資料皆從後端 API 讀取。

---

## 後端架構

### 檔案結構

```
pos-backend/
├── server.js           # Express app、路由掛載、MongoDB 連線
├── seed.js             # 匯入 12 筆商品（首次執行一次）
├── .env                # PORT=3000, MONGO_URI
├── .env.example        # 環境變數範本（可推上 git）
├── models/
│   ├── Product.js
│   ├── Order.js
│   ├── Purchase.js     # 進貨單
│   └── Expense.js      # 費用記錄
└── routes/
    ├── products.js
    ├── orders.js
    ├── purchases.js
    ├── expenses.js
    └── reports.js
```

### 關鍵設定（必須，否則無法連線）

`server.js` 和 `seed.js` 開頭第二行必須加：

```js
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
```

**原因：** Node.js v22+ 在 Windows 上無法解析 MongoDB Atlas SRV 記錄，必須強制指定 DNS。

---

## 資料流

### 結帳流程

```
OrderScreen (cart) → OrderConfirmModal
  → emit('checkout', payload)
  → App.vue handleCheckout()
  → POST /api/orders
  → normalizeOrder(_id → id, createdAt → ts/date)
  → prepend to orders[]
```

### 退款流程

```
HistoryScreen → refund button
  → emit('refund', order._id)
  → App.vue handleRefund(mongoId)
  → PATCH /api/orders/:id/refund
  → 更新 orders[] 內該筆記錄
```

### 商品管理流程

```
ProductsScreen → emit('update:products', newList)
  → App.vue handleProductsUpdate()
  → diff 比對新舊陣列 → CREATE / UPDATE / DELETE
  → 更新 products[]
```

### 帳務流程（AccountingScreen 自管）

```
AccountingScreen onMounted / watch(currentMonth)
  → fetchPurchases + fetchExpenses（帶 ?month=）
  → 顯示清單、明細、統計

新增/編輯 → POST or PUT /api/purchases|expenses
刪除     → DELETE /api/purchases|expenses/:id
```

---

## Schema

### Product

```js
{ cat, name, price, color, desc, note, isAvailable,
  modifierProfile: { selectCount, upgradeBoba, bobaCount } }
```

### Order

```js
{
  orderNo,    // ORD-YYMMDD-0001（當日流水號）
  items: [{
    pid, name, qty, unitPrice, price,
    selects: [String],
    bobaFlavors: [String],
    upgradedBobas: Number,
    addons: [{ name, qty, price }],
    note: String,
  }],
  subtotal, discount, total,
  payment: 'cash'|'card'|'linepay'|'jko',
  status: 'completed'|'refunded',
  // timestamps: createdAt (UTC)
}
```

### Purchase

```js
{
  date: Date,
  supplier: String,
  note: String,
  items: [{ name, qty, unit, unitCost, total }],
  total: Number,
  // timestamps: createdAt
}
```

### Expense

```js
{
  date: Date,
  category: '水電'|'租金'|'人事'|'耗材'|'其他',
  amount: Number,
  desc: String,
  receipt: String,
  // timestamps: createdAt
}
```
---
# 部署 (我是免費仔)

## 架構總覽

```
使用者瀏覽器
    │
    ▼
Vercel（前端 Vue SPA）
    │ HTTPS API 請求
    ▼
Render（後端 Express）
    │ Mongoose
    ▼
MongoDB Atlas（資料庫，已部署於 GCP）
```

---

## 免費方案限制一覽

### MongoDB Atlas — M0 Free Tier
| 項目 | 限制 |
|------|------|
| 儲存空間 | 512 MB |
| 連線數 | 最多 500 |
| 閒置暫停 | 連續 **60 天無讀寫**才暫停（手動 Resume 可恢復，資料不會消失） |
| 地區 | 固定（建立時選定，無法更改） |
| 費用 | **永久免費** |

### Render — Free Instance
| 項目 | 限制 |
|------|------|
| 運算時間 | 每月 **750 小時**（單一服務足夠跑整月） |
| 冷啟動 | 閒置 **15 分鐘**後休眠，下次請求需等 **30–50 秒** |
| 記憶體 | 512 MB RAM |
| 頻寬 | 100 GB / 月 |
| 費用 | **永久免費**（付費版 $7/月 可消除冷啟動） |

> **POS 使用建議：** 每天開店前先開一次報表頁，讓後端熱機後再開始結帳。

### Vercel — Hobby Plan
| 項目 | 限制 |
|------|------|
| 部署次數 | 無限制 |
| 頻寬 | 100 GB / 月 |
| 自動 HTTPS | ✓ |
| 自訂網域 | ✓（免費） |
| 費用 | **永久免費**（個人/非商業用途） |

---
