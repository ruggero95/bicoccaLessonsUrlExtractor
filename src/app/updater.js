const EventEmitter = require('events');
const logger = require('../core/logger');

const updaterEmitter = new EventEmitter()
const UPDATER_TEXT = 'updateMessageStatus'


class Updater{
    UPDATER_TEXT = 'updateMessageStatus'
    setup = {
        browser:{state:0, time:''},
        login:{state:0, time:''},
        lezione:{state:0, time:''},
        player:{state:0, time:''},
        link:{state:0, time:''},
        fine:{state:0, time:''},
    }
    positive = '✅'
    waiting = '⏳'
    constructor(){
        this.emitter = new EventEmitter()
    }

    subscribe(fn){
        this.emitter.on(this.UPDATER_TEXT, fn)
    }

    unsubscribe(fn){
        this.emitter.off(this.UPDATER_TEXT, fn)       
    }

    sendUpdate(){
        this.emitter.emit(this.UPDATER_TEXT, this.toString())
    }

    getTime(){
        const now = new Date()
        return now.getMinutes()+":"+now.getSeconds()
    }
    setSetup(key, send = true){
        if(!this.setup[key]){
            logger.error('cannot set state')
            return
        }
        this.setup[key] = {state: 1, time: this.getTime()}
        if(send){
            this.sendUpdate()
        }
    }

    toString(){
        return Object.entries(this.setup).map(([key, value])=>`${key}: ${value.state ? this.positive+" "+value.time : this.waiting}\n`).join('')
    }
}

module.exports = {updaterEmitter, UPDATER_TEXT, Updater}