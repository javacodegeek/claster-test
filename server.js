'use strict';

const config = require('config');
const Instance = require('./instance');
const redis = require("redis");
let client = redis.createClient();
client.on("error", function (err) {
    console.log("Error " + err);
});

let serverInstance = new Instance(1);

let timerMessage = setInterval(function() {

    let messageBody = { "serverId": serverInstance.serverId,
                    "timestamp": new Date().getTime().toString(),
                    "body": serverInstance.getMessage().toString(),
                    "status": "0",
                    "error": "0"
                  };

    let messageKey = "messageKey-" + serverInstance.serverId + '-' + new Date().getTime();

    client.HMSET(messageKey, messageBody, function(err, res){
        console.log(err);
    });

}, config.messageDelay);




console.log(serverInstance);