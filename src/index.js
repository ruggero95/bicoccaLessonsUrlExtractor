const bot = require('./bot')
const app = require('./app')
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
    bot.launch()
    app.listen(PORT, () => {
        console.log(`Running on port ${PORT}`)
    })
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
