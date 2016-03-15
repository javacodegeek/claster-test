'use strict';

const config = require('config');
const Instance = require('./instance');
const async = require('async');
const redis = require("redis");

let argv = require('minimist')(process.argv.slice(1));

let client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

let serverInstance = new Instance(2);

if(serverInstance.isGenerator()){
    let generatorInfo = { "serverId": serverInstance.serverId,
                          "timestamp": new Date().getTime().toString(),
                          "isRunning": "1"
    };

    client.HMSET("generator-info", generatorInfo, function(err, res){
        if (!err) {
            let timerMessage = setInterval(function() {
                let messageBody = { "serverId": serverInstance.serverId,
                    "timestamp": new Date().getTime().toString(),
                    "body": serverInstance.getMessage().toString()
                };
                console.log(messageBody.body);
                let messageKey = "messageKey-" + serverInstance.serverId + '-' + new Date().getTime();

                client.HMSET(messageKey, messageBody, function(err, res){
                });
            }, config.messageDelay);
        }
    });
}else {
    function handlePackageMsg(){
        async.waterfall([
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
                    console.log(msg.body);
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


    handlePackageMsg();





}





console.log(serverInstance);