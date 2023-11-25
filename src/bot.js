const { Telegraf, Scenes, session } = require('telegraf')
require('dotenv').config()
const { start, commands, linkCourse, linkLesson, getLinkLessonScene, getLinkCourseScene, linkCourseScene, linkLessonScene } = require('./app/telegram');

const bot = new Telegraf(process.env.API_TOKEN || '');
bot.use((ctx,next)=>{
	if (ctx.message.from.username != process.env.TELEGRAM_USERNAME) {
		return ctx.reply('Not authorized, deploy your own bot, follow readme instruction')
	}
	return next()
})

bot.start((ctx) => commands(ctx))
//app.command('a', )
const stage = new Scenes.Stage([getLinkLessonScene(), getLinkCourseScene()], {
	ttl: 30,
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


module.exports = bot