const path = require('path')
require('dotenv').config({ path: path.resolve('./config/.env') })
const converter = require("node-m3u8-to-mp4");
const puppeteer = require('puppeteer')
const fs = require('fs')
const user = process.env.USER || ''
const psw = process.env.PSW || ''
const puppeteerBicoccaJs = {
    test: async () => {
        let res = await puppeteerBicoccaJs.setup('https://elearning.unimib.it/mod/kalvidres/view.php?id=598157')
        console.log(res)
    },
    checkUrlValidity: (url) => {
        let pattern = /https\:\/\/elearning\.unimib\.it\/mod\/kalvidres\/view\.php\?id\=/
        if (url.match(pattern)) {
            return true
        }
        return false
    },
    doLogin: async () => {
        return new Promise(async (resolve, reject) => {
            //login:  https://idp-idm.unimib.it/idp/profile/SAML2/Redirect/SSO?execution=e1s2
            const browser = await puppeteer.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', });
            const page = await browser.newPage();
            //await page.setViewport({ width: 800, height: 600 })
            await page.goto('https://elearning.unimib.it/login/index.php');


            await page.waitForSelector('a[title=UniMiB]');
            await page.click('a[title=UniMiB]');

            await page.waitForSelector('input[name=j_username]');
            await page.$eval('input[name=j_username]', (el, value) => el.value = value, user);
            await page.$eval('input[name=j_password]', (el, value) => el.value = value, psw);
            await page.click('button[name=_eventId_proceed]');
            await puppeteerBicoccaJs.waitPage(page, false)
            await page.waitForSelector('div[id=nav-drawer]');
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
    sanitizeName:(string)=>{
        return string.replace('Kaltura Video Resource', '').replace(/ /g,'_').replace(/\//g,'').replace(/\\/g,'').replace(/\:/g,'').replace(/\-/g,'')
    },
    getVideoUrl: async (page) => {
        return new Promise(async (resolve, reject) => {
            const [elementHandle] = await page.$x('//*[@id="contentframe"]');
            const propertyHandle = await elementHandle.getProperty('src');
            const propertyValue = await propertyHandle.jsonValue();

            await page.goto(propertyValue);
            await page.waitForSelector('iframe[id=kplayer_ifp]');

            await page.waitForTimeout(2000)
            page.on('response', async (response) => {
                let pattern = /a.mp4\/index.m3u8/
                let url = response.url()
                if (url.match(pattern)) {
                    await page.evaluate(_ => {
                        // this will be executed within the page, that was loaded before
                        let pl = document.getElementById(kMainPlayerEmbedObject.targetId);
                        pl.sendNotification('doPause')
                    }).catch(()=>{
                        console.log('errore su pausa, la navigazione è terminata')
                    });
                    //console.log(url)
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
    setup: async (url) => {
        return new Promise(async (resolve, reject) => {

            let { page, browser } = await puppeteerBicoccaJs.doLogin();

            await page.goto(url);
            await puppeteerBicoccaJs.waitPage(page)


            let videoUrl = await puppeteerBicoccaJs.getVideoUrl(page)

            await browser.close();

            resolve(videoUrl)
            //PRENDO I FRAME SRC E LO VISITO
            //var pl = document.getElementById(kMainPlayerEmbedObject.targetId);pl.sendNotification('doPlay')
        })

    },
    convertM3U8: async (links, folderName)=>{
        for(let i in links){
            let fileName = `${__dirname}/../video/${folderName}/${links[i].title}.mp4`
            console.log(fileName)
            if(!fs.existsSync(fileName)){
                console.log('file non esiste')
                if(links[i].m3u8){                    
                    await converter(links[i].m3u8, fileName).catch((e)=>{
                        e.toString()
                    })    
                    console.log('ended'+i)
                }                               
            }
            if(i!=0 && i%10==0){
                //stoppo per 10 secondi ogni 10 download
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
        return
    },
    pageAnalizer: async (url) => {
        let { page, browser } = await puppeteerBicoccaJs.doLogin()
        let result = []
        await page.goto(url);
        let folderName = await page.title();
        
        folderName = puppeteerBicoccaJs.sanitizeName(folderName)
        let dataBkp = `${__dirname}/../video/${folderName}/data.json`

        if(!fs.existsSync(`${__dirname}/../video/${folderName}/`)){
            fs.mkdirSync(`${__dirname}/../video/${folderName}/`, { recursive: true })
        }

        if(fs.existsSync(dataBkp)){
            browser.close()
            console.log('')
            const data = fs.readFileSync(dataBkp, 'utf8')
            result = JSON.parse(data)
            console.log(result)
            return puppeteerBicoccaJs.convertM3U8(result, folderName)         
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
                title: puppeteerBicoccaJs.sanitizeName(text)
            }]
        }

        //cerco l m3u8
        for(i in result){
        //for(let i=0; i<1; i++){
            await page.goto(result[i].url);
            let url = await puppeteerBicoccaJs.getVideoUrl(page)
            if (i != 0 && i % 10 == 0) {
                page.waitForTimeout(2000)
            }
            result[i].m3u8 = url
        }
        await browser.close();

        let data = JSON.stringify(result);
        fs.writeFileSync(dataBkp, data);

        puppeteerBicoccaJs.convertM3U8(result, folderName)
    }

}

module.exports = puppeteerBicoccaJs