const express = require('express')
const router = express.Router()
const aboutRouter = require('../../app/controllers/AboutController')

router.use('/', aboutRouter.index)

module.exports = router