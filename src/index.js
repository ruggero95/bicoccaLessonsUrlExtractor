//const csBic = require('./app/puppeteerBicocca')
//csBic.test()
require('dotenv').config()

//const telegram = require('./app/telegram')

//telegram.init()

//csBic.pageAnalizer('https://elearning.unimib.it/course/view.php?id=31208')
//csBic.pageAnalizer('https://elearning.unimib.it/course/view.php?id=31198')
const { Telegraf, Scenes } = require('telegraf')
const { start, commands, linkCourse, linkLesson, getLinkLessonScene } = require('./app/telegram')

const bot = new Telegraf(process.env.API_TOKEN || '');




bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));