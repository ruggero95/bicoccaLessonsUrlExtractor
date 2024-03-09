const path = require('path')
require('dotenv').config({ path: path.resolve('./config/.env') })
const { mConverter, mDownloader, mParser } = require("node-m3u8-to-mp4");
const puppeteer = require('puppeteer')
const fs = require('fs')
const user = process.env.USEREMAIL || ''
const psw = process.env.PSW || ''
const logger = require('../../core/logger')
const headless =  process.env.HEADLESS ?  process.env.HEADLESS==='true' : true
const EventEmitter = require('events');
const dayjs = require('dayjs');
const downloadUpdater = new EventEmitter();

const bicoccaModel = {
    videoPath: `${__dirname}/../../../video`,
    checkLessonUrlValidity: (url) => {
        let pattern = /https\:\/\/elearning\.unimib\.it\/mod\/kalvidres\/view\.php\?id\=/
        return url.match(pattern) ? true : false
    },
    checkCourseUrlValidity: (url) => {
        let pattern = /https\:\/\/elearning\.unimib\.it\/course\/view\.php\?id\=/
        return url.match(pattern) ? true : false       
    },
    doLogin: async (updater) => {
        return new Promise(async (resolve, reject) => {    

            const browser = await puppeteer.launch({ headless, executablePath: process.env.CHROME_PATH, args:["--no-sandbox"]});
            const page = await browser.newPage();
            
            logger.info('Browser istanziato')
            updater.setSetup('browser')
          
            await page.goto('https://elearning.unimib.it/login/index.php');


            await page.waitForSelector('a[title=UniMiB]');
            await page.click('a[title=UniMiB]');

            await page.waitForSelector('input[name=j_username]');
            await page.$eval('input[name=j_username]', (el, value) => el.value = value, user);
            await page.$eval('input[name=j_password]', (el, value) => el.value = value, psw);
            await page.waitForSelector('button[name=_eventId_proceed]')
            await page.waitForTimeout(2000)
            await page.click('button[name=_eventId_proceed]');
            await page.waitForXPath('//h1[contains(text(),"Dashboard")]')
            logger.info('Login eseguito')
            updater.setSetup('login')
            resolve({ page: page, browser: browser })
        })

    },
    waitPage: async (page, timeout = true) => {
        await page.waitForSelector('div[id=nav-drawer]');
        if (timeout) {
            await page.waitForTimeout(2000)
        }
        return
    },
    sanitizeName: (string) => {
        if(!string){
            return ''
        }
        return string.replace('Kaltura Video Resource', '').replace(/ /g, '_').replace(/\//g, '').replace(/\\/g, '').replace(/\:/g, '').replace(/\-/g, '')
    },
    getVideoUrl: async (page, updater) => {
        return new Promise(async (resolve, reject) => {            
            const [elementHandle] = await page.$x('//*[@id="contentframe"]');
            const propertyHandle = await elementHandle.getProperty('src');
            const propertyValue = await propertyHandle.jsonValue();

            await page.goto(propertyValue);
            await page.waitForSelector('iframe[id=kplayer_ifp]');
            logger.info('attendo player start')
            updater.setSetup('player')
            await page.waitForTimeout(2000)
            page.on('response', async (response) => {
                let pattern = /a.mp4\/index.m3u8/
                let url = response.url()
                if (url.match(pattern)) {
                    await page.evaluate(_ => {
                        // this will be executed within the page, that was loaded before
                        let pl = document.getElementById(kMainPlayerEmbedObject.targetId);
                        pl.sendNotification('doPause')
                    }).catch(() => {
                        logger.error('errore su pausa, la navigazione è terminata')
                    });
                    //console.log(url)
                    logger.info('link streaming ottenuto')
                    updater.setSetup('link')
                    resolve(url)
                }
            });
            await page.evaluate(_ => {
                // this will be executed within the page, that was loaded before
                let pl = document.getElementById(kMainPlayerEmbedObject.targetId);
                pl.sendNotification('doPlay')
            });
        })

    },
    setup: async (url, updater) => {
        return new Promise(async (resolve, reject) => {

            let { page, browser } = await bicoccaModel.doLogin(updater);

            await page.goto(url);
            await page.waitForSelector('span.card-suptitle.course-type.text-truncate')
            logger.info('alla pagina della lezione')
            updater.setSetup('lezione')

            let videoUrl = await bicoccaModel.getVideoUrl(page, updater)

            await browser.close();
            logger.info('fine')
            updater.setSetup('fine')

            resolve(videoUrl)         

            //PRENDO I FRAME SRC E LO VISITO
            //var pl = document.getElementById(kMainPlayerEmbedObject.targetId);pl.sendNotification('doPlay')
        })

    },
    convertM3U8: async (links, folderName) => {
        const tempPath = `${bicoccaModel.videoPath}/${folderName}/tmp`
        if (fs.existsSync(tempPath)) {
            fs.rmSync(tempPath,{ recursive: true })
            fs.mkdirSync(tempPath, { recursive: true, mode: 0777 })
        }
        for (let i in links) {
            let fileName = `${bicoccaModel.videoPath}/${folderName}/${i}_${links[i].title}.mp4`

            console.log(fileName)
            if (!fs.existsSync(fileName)) {
                console.log('file non esiste, processo')
                const fileLink = links[i].m3u8
                try{
                    await bicoccaModel.processSingleM3U8(fileLink, fileName, i, tempPath, links.length)
                }catch(e){
                    console.log(e.code)
                    console.log(e)
                    console.log('converting error'+dayjs().format('YYYY-MM-DD HH:mm:ss'))
                    console.log('retry in 10 sec')
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    console.log('retry'+dayjs().format('YYYY-MM-DD HH:mm:ss'))
                    await bicoccaModel.processSingleM3U8(fileLink, fileName, i, tempPath, links.length)
                }
            }


        }
        return folderName
    },
    processSingleM3U8: async(fileLink, fileName, i, tempPath, total)=>{
        if (fileLink) {                        
                const list = await mParser(fileLink)
                const medias = list.map((e) => `${e.url}`)
                await mDownloader(medias, { targetPath: tempPath })
                await mConverter(tempPath, fileName).catch((e) => {
                    console.log('convert error')
                    console.log(e.toString())
                })
                downloadUpdater.emit('updateDownloaded', { elementi: total, elaborati: (i+1) });          
        }
        if(i!=0 && i%10==0){
            //stoppo per 10 secondi ogni 10 download
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    },
    pageAnalizer: async (url) => {
        let { page, browser } = await bicoccaModel.doLogin()
        let result = []
        await page.goto(url);
        let folderName = await page.title();

        folderName = bicoccaModel.sanitizeName(folderName)

        const coursePath = `${bicoccaModel.videoPath}/${folderName}`
        let dataBkp = `${coursePath}/data.json`

        if (!fs.existsSync(coursePath)) {
            fs.mkdirSync(coursePath, { recursive: true })
        }

        if (fs.existsSync(dataBkp)) {
            await browser.close()

            const data = fs.readFileSync(dataBkp, 'utf8')
            result = JSON.parse(data)
            downloadUpdater.emit('updateCollected', { elementi: result.length, elaborati: result.length });
            return bicoccaModel.convertM3U8(result, folderName)
        }
        const elements = await page.$x('//a[@class="aalink"  and contains(@href,\'kalvidres\')]');
        //console.log(elements)
        for (let i in elements) {
            let hrefProp = await elements[i].getProperty('href')
            //let [textElement] = await elements[i].$x('/span[@class="instancename"]//text()')
            let href = await hrefProp.jsonValue()
            let textProp = await elements[i].getProperty('textContent')
            let text = await textProp.jsonValue()

            result = [...result, {
                url: href,
                title: bicoccaModel.sanitizeName(text)
            }]
        }

        //cerco l m3u8
        for (i in result) {
            //for(let i=0; i<1; i++){
            await page.goto(result[i].url);
            let url = await bicoccaModel.getVideoUrl(page)
            if (i != 0 && i % 10 == 0) {
                page.waitForTimeout(2000)
            }
            result[i].m3u8 = url
            downloadUpdater.emit('updateCollected', { elementi: result.length, elaborati: (i+1) });
        }
        await browser.close();

        let data = JSON.stringify(result);
        fs.writeFileSync(dataBkp, data);

        return bicoccaModel.convertM3U8(result, folderName)
    }

}

module.exports = { bicoccaModel, downloadUpdater }