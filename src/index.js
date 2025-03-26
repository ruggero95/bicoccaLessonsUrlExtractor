const bot = require('./bot')
const app = require('./app')
const axios = require('axios')
require('dotenv').config()
const PORT = process.env.PORT || 4003
process.on('uncaughtException', (err) => {
	//todo add logger
   console.log('errore')
   console.log(err)    
});


if(process.env.NODE_ENV=='production'){
    (async ()=>{
        const wb = await bot.createWebhook({ domain: process.env.APP_URL })
        app.use(wb);
        app.listen(PORT, () => {
            console.log(`Running on port ${PORT}`)
        })
    })();
}else{
    (async ()=>{
        console.log('resetting')
        //const response = await axios.get(`https://api.telegram.org/bot${process.env.API_TOKEN}/setWebhook?url=https://bicocca-bot.onrender.com`)
        //const response = await axios.get(`https://api.telegram.org/bot${process.env.API_TOKEN}/getWebhookInfo`)
        //const response = await axios.post(`https://api.telegram.org/bot${process.env.API_TOKEN}/deleteWebhook`)
        //console.log(response)
        //console.log(response.data)
        bot.launch()
        app.listen(PORT, () => {
            console.log(`Running on port ${PORT}`)
        })
    })();

    
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
