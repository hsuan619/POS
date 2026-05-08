require('dotenv').config()
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8'])
const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/products',  require('./routes/products'))
app.use('/api/orders',    require('./routes/orders'))
app.use('/api/reports',   require('./routes/reports'))
app.use('/api/purchases', require('./routes/purchases'))
app.use('/api/expenses',  require('./routes/expenses'))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB 連線成功')
    app.listen(process.env.PORT || 3000, () =>
      console.log(`Server running on port ${process.env.PORT || 3000}`)
    )
  })
  .catch(err => {
    console.error('MongoDB 連線失敗', err.message)
    process.exit(1)
  })
