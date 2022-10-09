const path = require('path')
require('dotenv').config({path:path.resolve('./config/.env')})
const API_TOKEN = process.env.API_TOKEN || '';
const offline = process.env.OFFLINE || 'false'//non bool from env
const PORT = process.env.PORT || 3029;
const URL = process.env.URL || 'https://hps.solunicanet.it';
const axios = require('axios');
const telegraf = require('telegraf')
const bicocca = require('./puppeterBicocca')
const STD_MESSAGE = 'elaboro...😁'
const telegram = {
    init:()=>{
        const app = new telegraf(API_TOKEN);

        if(offline=='false'){
            app.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
            app.startWebhook(`/bot${API_TOKEN}`, null, PORT);
        }else{
            console.log(`https://api.telegram.org/bot${process.env.API_TOKEN}/setWebhook?url=`)
            axios.get(`https://api.telegram.org/bot${process.env.API_TOKEN}/setWebhook?url=`)
        }
        
        telegram.listners(app)
        
        if(offline=='true'){
            app.startPolling();      
        }
        return app
    },
    listners:(app)=>{
        app.on('text',async function(ctx){
            if(ctx.message.from.username=='RuggeroPanzeri'){
                ctx.reply(STD_MESSAGE);
                let url = ctx.message.text
                if(bicocca.checkUrlValidity(url)){
                    let res_url = await bicocca.setup(url)
                    
                    ctx.reply(res_url)
                }else{
                    ctx.reply('Url scorretto');
                }
            }else{
                ctx.reply('Non autorizzato mi spiace');
            }
        })
    }
}

module.exports = telegram