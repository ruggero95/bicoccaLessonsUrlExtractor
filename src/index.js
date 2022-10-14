const bot = require('./bot')
const app = require('./app')
require('dotenv').config()
const PORT = process.env.PORT || 4003
process.on('uncaughtException', (err) => {
	//todo add logger
   console.log('errore')
   console.log(err)    
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

app.listen(PORT,()=>{
    console.log(`Running on port ${PORT}`)
})