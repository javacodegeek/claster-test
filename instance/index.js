'use strict';

const config = require('config');
const md5 = require('md5')

const SERVER_TYPE_GENERATOR = 1
const SERVER_TYPE_WORKER = 2


module.exports = class {

    constructor(type){
        this.startAt = new Date().getTime();
        this.serverId = this.generateServerId();
        switch (type) {
            case 1:
                this.serverId = 1;
                break;
            case 2:
                this.serverId = 2;
                break;
            default:
                this.serverId = 2;
                break;
        }

    }

    generateServerId(){
        let timestamp = new Date().getTime();
        let serverId = md5 (timestamp + config.secretKey);
            return serverId;
    }

    defineAsGenerator(){
        this.serverType = 1;
    }

    isGenerator(){
        if(this.serverType == 1){
            return true;
        }else {
            return false;
        }
    }

    isWorker(){
        if(this.serverType == 1){
            return false;
        }else {
            return true;
        }
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

