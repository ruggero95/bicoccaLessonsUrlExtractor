const path = require('path')
require('dotenv').config()
const API_TOKEN = process.env.API_TOKEN || '';
const offline = process.env.OFFLINE || 'false'//non bool from env
const PORT = process.env.PORT || 3029;
const URL = process.env.URL || 'https://hps.solunicanet.it';
const axios = require('axios');
const { Telegraf, Markup, Scenes } = require('telegraf')
const { enter, leave } = Scenes.Stage;
const bicocca = require('./puppeteerBicocca')
const STD_MESSAGE = 'elaboro...😁'
const telegram = {
    init: () => {
        const app = new Telegraf(API_TOKEN);

        if (offline == 'false') {
            app.telegram.setWebhook(`${URL}/bot${API_TOKEN}`);
            app.startWebhook(`/bot${API_TOKEN}`, null, PORT);
        } else {
            console.log(`https://api.telegram.org/bot${process.env.API_TOKEN}/setWebhook?url=`)
            axios.get(`https://api.telegram.org/bot${process.env.API_TOKEN}/setWebhook?url=`)
        }

        telegram.listners(app)

        if (offline == 'true') {
            app.startPolling();
        }
        return app
    },
    listners: (app) => {
        app.on('text', async function (ctx) {
            if (ctx.message.from.username != 'RuggeroPanzeri') {
                return ctx.reply('Non autorizzato, mi spiace')
            }
            ctx.reply(STD_MESSAGE);
            let url = ctx.message.text
            if (bicocca.checkUrlValidity(url)) {
                let res_url = await bicocca.setup(url)
                ctx.reply(res_url)
            } else {
                ctx.reply('Url non corretto');
            }

        })
    }
}
const tel = {
    linkLesson: "Link Lesson",
    linkCourse: "Link Course",
    start: async (ctx) => {
        return await ctx.reply('Scegli un opzione')
    },
    commands: async (ctx) => {
        return await ctx.reply('Choose an option', Markup
            .keyboard([
                [tel.linkLesson, tel.linkCourse]
            ])
            .resize()
        )
    },
   

}

module.exports = tel