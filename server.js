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
    serverInstance.getMessage();
    let message = { "serverId": serverInstance.serverId,
                    "timestamp": new Date().getTime().toString(),
                    "body": serverInstance.getMessage().toString(),
                    "status": "0",
                    "error": "0"
                  };

    console.log(message);
}, config.messageDelay);

console.log(serverInstance);