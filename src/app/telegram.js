require('dotenv').config()
const {  Markup, Scenes } = require('telegraf')
const { leave } = Scenes.Stage;
const { bicoccaModel, downloadUpdater, buildUpdateMessage } = require('./bicocca/bicocca.model')
const WAIT_MESSAGE = 'Wait some minutes...⏳'
const WAIT_MESSAGE_COURSE = 'This process it can takes hours...⏳'
const logger = require('./../core/logger');
const { Updater } = require('./updater');
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
    updateMessageStatus: (ctx, chat_id, message_id)=>{
        return async (message)=>{
            try{
                await ctx.telegram.editMessageText(chat_id, message_id, undefined, message)
            }catch(e){
                logger.error('cannot send message update status')
                logger.error(e)
            }
    
        }
    },
    startLinkScan: async (ctx) => {
        let url = ctx.message.text
        if (!bicoccaModel.checkLessonUrlValidity(url)) {
            return await ctx.reply('Url invalid for a lesson');
        }
        await ctx.reply(WAIT_MESSAGE)
        const updater = new Updater()           
        const msgUpdate = await ctx.reply(updater.toString())
        updater.unsubscribe(telegramModel.updateMessageStatus(ctx, msgUpdate.chat.id, msgUpdate.message_id))
        updater.subscribe(telegramModel.updateMessageStatus(ctx, msgUpdate.chat.id, msgUpdate.message_id))            
        let res_url = await bicoccaModel.setup(url, updater)            
        return await ctx.reply(res_url)        
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

            const folderName = await bicoccaModel.pageAnalizer(url)
            /* await ctx.reply("End of analisis, download here", {
                reply_markup: {
                    inline_keyboard: [                       
                        [ { text: "Open in browser", url: `${process.env.APP_URL}/bicocca/get-course?filename=${folderName}` } ]
                    ]
                }
            });*/
            await ctx.reply('End of analisis')
            return await ctx.reply(`${process.env.APP_URL}/bicocca/get-course?filename=${folderName}`)
        } else {
            return await ctx.reply('Url invalid for a course');
        }
    }
}

module.exports = telegramModel