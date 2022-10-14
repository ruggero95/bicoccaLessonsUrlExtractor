const express = require('express')
const mainRouter = express.Router()
const bicoccaRouter = require('./bicocca/bicocca.controller')


mainRouter.use('/bicocca',bicoccaRouter)

module.exports = mainRouter