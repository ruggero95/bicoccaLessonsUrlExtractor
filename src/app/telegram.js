const path = require('path')
require('dotenv').config()
const API_TOKEN = process.env.API_TOKEN || '';
const offline = process.env.OFFLINE || 'false'//non bool from env
const PORT = process.env.PORT || 3029;
const URL = process.env.URL || 'https://hps.solunicanet.it';
const axios = require('axios');
const { Telegraf, Markup, Scenes } = require('telegraf')
const { enter, leave } = Scenes.Stage;
const { bicoccaModel, downloadUpdater } = require('./bicocca/bicocca.model')
const WAIT_MESSAGE = 'Wait some minutes...⏳'
const WAIT_MESSAGE_COURSE = 'This process it can takes hours...⏳'
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
            if (bicoccaModel.checkUrlValidity(url)) {
                let res_url = await bicoccaModel.setup(url)
                ctx.reply(res_url)
            } else {
                ctx.reply('Url non corretto');
            }

        })
    }
}
const telegramModel = {
    linkLesson: "Link Lesson",
    linkCourse: "Link Course",
    linkLessonScene: "linkLesson",
    linkCourseScene: "linkCourse",
    start: async (ctx) => {
        return await ctx.reply('Scegli un opzione')
    },
    commands: async (ctx) => {
        return await ctx.reply('Choose an option', Markup
            .keyboard([
                [telegramModel.linkLesson, telegramModel.linkCourse],
                ['/back'],
            ])
            .resize()
        )
    },
    getLinkLessonScene: () => {
        //extract link of a lesson to for VLC network in order to accelerate it or see on ipads
        const s = new Scenes.BaseScene(telegramModel.linkLessonScene);
        s.enter(ctx => ctx.reply("Send link of a lesson"));

        //on leave resend commands
        s.leave(ctx => telegramModel.commands(ctx));
        s.command("back", leave());
        //if change button, change scene
        s.hears(telegramModel.linkCourse, (ctx) => ctx.scene.enter(telegramModel.linkCourseScene))
        //start analisis
        s.on("text", ctx => telegramModel.startLinkScan(ctx));
        s.on("message", ctx => ctx.reply("Only link please"));
        return s
    },
    getLinkCourseScene: () => {
        const s = new Scenes.BaseScene(telegramModel.linkCourseScene);
        s.enter(ctx => ctx.reply("Send link of a course"));

        //on leave resend commands
        s.leave(ctx => telegramModel.commands(ctx));
        s.command("back", leave());
        //if change button, change scene
        s.hears(telegramModel.linkLesson, (ctx) => ctx.scene.enter(telegramModel.linkLessonScene))
        s.on("text", ctx => telegramModel.startCourseScan(ctx));
        s.on("message", ctx => ctx.reply("Only link please"));
        return s
    },
    startLinkScan: async (ctx) => {
        let url = ctx.message.text
        if (bicoccaModel.checkLessonUrlValidity(url)) {
            await ctx.reply(WAIT_MESSAGE)
            let res_url = await bicoccaModel.setup(url)
            return await ctx.reply(res_url)
        } else {
            return await ctx.reply('Url invalid for a lesson');
        }
    },
    startCourseScan: async (ctx) => {
        let url = ctx.message.text
        if (bicoccaModel.checkCourseUrlValidity(url)) {
            let wait = await ctx.reply(WAIT_MESSAGE_COURSE)
            let collected = await ctx.reply('TotLinks:0  Collected:0')
            let downloaded = await ctx.reply('TotLinks:0  Downloaded:0')
            //todo catch event on processing and update a message
            downloadUpdater.on('updateCollected', async (data) => {
                try {
                    collected = await ctx.telegram.editMessageText(collected.chat.id, collected.message_id, undefined, `TotLinks:${data.elementi}, Collected:${data.elaborati} `)
                } catch (e) {
                    console.log('error sending ctx update')
                    console.log(e)
                }
            })
            downloadUpdater.on('updateDownloaded', async (data) => {
                try {
                    downloaded = await ctx.telegram.editMessageText(downloaded.chat.id, downloaded.message_id, undefined, `TotLinks:${data.elementi}, Downloaded:${data.elaborati} `)
                } catch (e) {
                    console.log('error sending ctx update')
                    console.log(e)
                }
            })

            await bicoccaModel.pageAnalizer(url)
            return await ctx.reply('End')
        } else {
            return await ctx.reply('Url invalid for a course');
        }
    }
}

module.exports = telegramModel