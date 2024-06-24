const express = require('express')
const router = express.Router()
const checkSourceController = require('../../app/controllers/CheckSourceController')

router.get('/', checkSourceController.get)

router.post('/', checkSourceController.post)

module.exports = router