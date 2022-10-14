const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const {SuccessResponse} = require('./core/response')
const mainRouter = require('./app/index')
const app = express()
const corsOptions = {
    origin:true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
    exposeHeaders:['*','Content-Disposition']
}

app.use(helmet())
app.use(cors(corsOptions))
app.get('/',(req, res, next)=>{
    return new SuccessResponse('Running 👍').send(res)
})
app.use(mainRouter)

//TODO add handler errors

module.exports = app