'use strict';

const config = require('config');
const Instance = require('./instance');
const Warlock = require('node-redis-warlock');
const redis = require("redis");

let client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

let serverInstance = new Instance(2);



if(serverInstance.isGenerator()){
    let timerMessage = setInterval(function() {
        let messageBody = { "serverId": serverInstance.serverId,
                            "timestamp": new Date().getTime().toString(),
                            "body": serverInstance.getMessage().toString(),
                          };

        let messageKey = "messageKey-" + serverInstance.serverId + '-' + new Date().getTime();

        client.HMSET(messageKey, messageBody, function(err, res){
            console.log(err);
        });
    }, config.messageDelay);
}else {
    client.keys("messageKey*", function (err, replies) {
        let hkeysList = replies;
        console.log(hkeysList.length);
        for (let hkey of hkeysList) {
            let new_hkey = "lock-" + hkey;
            client.rename(hkey, new_hkey, function (err, res) {
                console.log(err);
                if (!err) {
                    client.hgetall(new_hkey, function (err, res) {
                        let message = res.body;
                        if (!err) {
                            serverInstance.eventHandler(message, function (err, msg) {
                                if (!err){
                                    let err_new_hkey = "error-" + new_hkey;
                                    console.log(err_new_hkey);
                                }else {
                                    let suc_new_hkey = "success-" + new_hkey;
                                    console.log(suc_new_hkey);
                                }
                            });
                        }

                    });
                }
            });
        }
    });

}





console.log(serverInstance);