//const csBic = require('./app/puppeteerBicocca')
//csBic.test()
require('dotenv').config()

//const telegram = require('./app/telegram')

//telegram.init()

//csBic.pageAnalizer('https://elearning.unimib.it/course/view.php?id=31208')
//csBic.pageAnalizer('https://elearning.unimib.it/course/view.php?id=31198')
const { Telegraf, Scenes, session } = require('telegraf')
const { start, commands, linkCourse, linkLesson, getLinkLessonScene, getLinkCourseScene, linkCourseScene, linkLessonScene } = require('./app/telegram')

const bot = new Telegraf(process.env.API_TOKEN || '');

bot.start((ctx) => commands(ctx))
//app.command('a', )
const stage = new Scenes.Stage([getLinkLessonScene(), getLinkCourseScene()], {
	ttl: 10,
});
bot.use(session());
bot.use(stage.middleware());
bot.use((ctx, next) => {
	// we now have access to the the fields defined above
	ctx.scene.session.mySceneSessionProp ??= 0;
	return next();
});
bot.hears(linkLesson, (ctx)=> ctx.scene.enter(linkLessonScene))
bot.hears(linkCourse, (ctx)=> ctx.scene.enter(linkCourseScene))
bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));