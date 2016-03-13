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
    console.log(serverInstance.getMessage());
}, config.messageDelay);

console.log(serverInstance);