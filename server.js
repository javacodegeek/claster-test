'use strict';

const config = require('config');
const Instance = require('./instance');
const async = require('async');
const redis = require("redis");
let argv = require('minimist')(process.argv.slice(2));
let client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

let serverInstance = new Instance(argv.t);


function generateMsgs() {
    if (!serverInstance.isGenerator()){
        return false
    }
    let generatorInfo = {
        "serverId": serverInstance.serverId,
        "timestamp": new Date().getTime().toString(),
        "lastMsgtimestamp": new Date().getTime().toString(),
        "isRunning": "1"
    };
    client.HMSET("generator-info", generatorInfo, function (err, res) {
        if (!err) {
            let timerMessage = setInterval(function () {
                let messageBody = {
                    "serverId": serverInstance.serverId,
                    "timestamp": new Date().getTime().toString(),
                    "body": serverInstance.getMessage().toString()
                };
                client.hset("generator-info", "lastMsgtimestamp", new Date().getTime().toString());
                console.log("message-body: " + messageBody.body);
                let messageKey = "messageKey-" + serverInstance.serverId + '-' + new Date().getTime();
                client.HMSET(messageKey, messageBody, function (err, res) {
                });
            }, config.messageDelay);
        }
    });
};

function handlePackageMsg(){
    if (serverInstance.isGenerator()){
        return false
    }
    async.waterfall([
        function(callback){
            client.hgetall("generator-info", function (err, res) {
                if (!err) {
                    if(((new Date().getTime()) - res.lastMsgtimestamp) > config.waitingForGenerator){
                        serverInstance.defineAsGenerator();
                        generateMsgs();
                        callback(true);
                    }

                    callback(null);
                } else {
                    callback(true);
                }
            });
        },
        function (callback) {
            client.keys("messageKey*", function (err, replies) {
                if (!err) {
                    callback(null, replies);
                } else {
                    callback(true);
                }
            });
        },
        function (replies, callback) {
            for (let hkey of replies) {
                let new_hkey = "lock-" + hkey;
                client.rename(hkey, new_hkey, function (err, res) {
                    if (!err) {
                        callback(null, new_hkey);
                    }
                });
            }
            callback(true);
        },
        function (new_hkey, callback) {
            client.hgetall(new_hkey, function (err, res) {
                let message = res;
                if (!err) {
                    callback(null, message, new_hkey);
                } else {
                    console.log(true);
                }
            });
        },
        function (message, new_hkey, callback) {
            serverInstance.eventHandler(message, function (err, msg) {
                console.log("handle-msg-body: " + msg.body);
                if (!err) {
                    callback(null, new_hkey, "success-" + new_hkey);
                } else {
                    callback(null, new_hkey, "error-" + new_hkey);
                }
            });
        },
        function (new_hkey, res_new_hkey, callback) {
            client.rename(new_hkey, res_new_hkey, function (err, res) {
                if (!err) {
                    callback(null, res)
                } else {
                    callback(true);
                }
            });
        },

    ], function (err, result) {
        handlePackageMsg();
    });
};


function getErrors(){
    async.waterfall([
        function (callback) {
            client.keys("error*", function (err, replies) {
                if (!err) {
                    callback(null, replies);
                } else {
                    callback(true);
                }
            });
        },
        function (replies, callback) {
            for (let hkey of replies) {
                client.hgetall(hkey, function (err, res) {
                    console.log(res);
                    if (!err) {
                        callback(null, hkey);
                    } else {
                        console.log(true);
                    }
                });
            }
        },
        function (hkey, callback){
            client.del(hkey, function(err, res){
                if(!err){
                    callback(null);
                }else{
                    callback(false);
                }
            });
        }
    ], function (err, result) {

    });
}


if (argv.getErrors == true){
    getErrors();
}else{
    if(serverInstance.isGenerator()){
        generateMsgs();
    }else {
        handlePackageMsg();
    }
    console.log(serverInstance);
}

