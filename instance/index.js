'use strict';
const md5 = require('md5')

module.exports = class {

    constructor(){
        this.startAt = new Date().getTime();
        this.serverId = this.generateServerId();
    }

    generateServerId(){
        let timestamp = new Date().getTime();
        let serverId = md5 (timestamp);
            return serverId;
    }
}

