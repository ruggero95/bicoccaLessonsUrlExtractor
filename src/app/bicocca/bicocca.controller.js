const express = require('express')
const { SuccessResponse, BadRequestResponse } = require('../../core/response')
const BicoccaService = require('./bicocca.service')
const router = express.Router()

router.get('/get-course', async (req, res, next) => {
    try {
        const { filename } = req.query
        if (!filename) {
            return new BadRequestResponse('Missing filename').send(res)
        }
        const bicoccaService = new BicoccaService()
        const exist = bicoccaService.checkFilePresence(filename)
        if (!exist) {
            return new BadRequestResponse('Missing file requested').send(res)
        }
        const { zipPath, zipName } = await bicoccaService.zipContent(filename)
        return new SuccessResponse('', zipPath + zipName).download(res)
    } catch (e) {
        next(e)
    }
})

module.exports = router