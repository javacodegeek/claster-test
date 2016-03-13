'use strict';

const config = require('config');
const md5 = require('md5')

module.exports = class {

    constructor(){
        this.startAt = new Date().getTime();
        this.serverId = this.generateServerId();
    }

    generateServerId(){
        let timestamp = new Date().getTime();
        let serverId = md5 (timestamp + config.secretKey);
            return serverId;
    }

    getMessage(){
        this.cnt = this.cnt || 0;
            return this.cnt++;
    }

    eventHandler(msg, callback){
        function onComplete(){
            let error = Math.random() > 0.85; callback(error, msg);
        }

        setTimeout(onComplete, Math.floor(Math.random()*1000));
    }

}

