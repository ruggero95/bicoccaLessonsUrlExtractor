const express = require('express')
const { SuccessResponse, BadRequestResponse } = require('../../core/response')
const BicoccaService = require('./bicocca.service')
const router = express.Router()

router.get('/get-course', async (req, res, next)=>{
    try{
        const fileName = req.params.filename
        if(!fileName){
            return new BadRequestResponse('Missing filename').send(res)
        }
        const bicoccaService = new BicoccaService()
        const exist = bicoccaService.checkFilePresence(fileName)
        if(!exist){
            return new BadRequestResponse('Missing file requested').send(res)
        }
        const {zipPath, zipName} = await bicoccaService.zipContent(fileName)
        return new SuccessResponse('',zipPath+zipName).download(res)
    }catch(e){
        next(e)
    }
})