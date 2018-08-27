"use strict"
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;

var bilibiliapi = require('./bilibili_api');
var api = new bilibiliapi();

var http = require('http');
var url = require('url');

//读取配置
var config = require('./config');

MongoClient.connect(config.server.mongodb.addr, function (err, db) {
    if (err) throw err;
    var dbo = db.db(config.server.mongodb.dbname);
    if (config.server.enable & config.client.enable) {
        server(dbo);
    } else if (config.client.enable) {
        client();
    } else {
        process.exit();
    }
});

async function server(dbo) {

    //检查数据库
    //移除任务锁定标志
    dbo.collection('index').deleteMany({ "lock": true }, function (err, obj) {
        if (err) throw err;

        //初始化服务器
        var http = require('http');
        var express = require('express');
        var app = express();
        var bodyParser = require('body-parser')
        app.use(bodyParser.json()); // for parsing application/json

        var clients = [];
        app.get('/pullTask', function (req, res) {
            //查找未完成的工作
            dbo.collection('index').findOne({ "complete": false }, async function (err, result) {
                if (err) throw err;
                if (result) {
                    return res.json(result).end();
                }
                //分配新工作
                var last = await dbo.collection('index').count();
                last = last * config.server.tasksize;
                var oid = new ObjectID();
                var task = {
                    _id: oid,
                    complete: false,
                    range: { start: last + 1, stop: last + config.server.tasksize },
                    last: last,
                    lock: true,
                    index: oid.toHexString(),
                    err: []
                }
                dbo.collection('index').insertOne(task, function (err, result) {
                    if (err) throw err;
                    res.json(task).end();
                    //定时检查心跳
                    clients[task._id] = { oid: task._id };
                    clients[task._id].beatscount=0;
                    clients[task._id].timer = setInterval(function (c) {
                        if (c.beatscount < 1) {
                            //dead
                            clearInterval(c.timer);
                            dbo.collection('index').updateOne({ _id: new ObjectID(c.oid) }, { $set: { lock: false } }, function (err, result) {
                                if (err) throw err;
                            });
                        }
                    }, config.server.clientlife, clients[task._id]);
                });
            });
        });

        app.post('/pushTask', function (req, response) {
            var json = req.body;
            dbo.collection('index').findOne({ _id: new ObjectID(json.task._id) }, function (err, result) {
                if (err) throw err;
                if (result) {
                    if (result.lock) {
                        clients[json.task._id].beatscount++;
                        //添加结果到数据库
                        dbo.collection(json.task._id).insertMany(json.result, function (err, res) {
                            if (err) throw err;
                            //更新任务状态到数据库
                            dbo.collection('index').updateOne(result, { $set: {last: json.task.last}}, function (err, result) {
                                if (err) throw err;
                                response.json(json.task).end();
                            });
                        });
                    } else {
                        response.statusCode(500).end('task not locked')
                    }
                } else {
                    response.statusCode(404).end('task not locked')
                }
            });

        });

        var server = app.listen(config.server.port, function () {
            console.log("Listening at http://%s:%s", server.address().address, server.address().port);
            if (config.client.enable) {
                client();
            }
        });
    });
}

async function client() {

    while (true) {
        try {
            var task = await pullTask(config.client.addr);
            var cache = [];
            var err = [];
            for (var i = task.last; i <= task.range.stop; i++) {
                autoSleep();
                console.log("aid: %s", i);
                let retry = 0;
                do {
                    try {
                        var result = await api.videoInfo(i);
                        cache.push(result);
                        break;
                    } catch (error) {
                        retry++;
                        if (retry >= config.client.retry) {
                            err.push(result);
                        }
                    }
                } while (retry < config.client.retry);

                if (i % config.client.blocksize == 0) {
                    //提交Task
                    try {
                        task.last = i;
                        task.err = task.err.concat(err);
                        var stat = await pushTask(config.client.addr, JSON.stringify({ task, result: cache }));
                        console.log(stat);
                    } catch (error) {
                        throw error;
                    }
                }

            }


        } catch (error) {
            console.log(error)
            process.exit();
        }
    }
}


function sleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function autoSleep(count) {
    if (!(count % 10)) {
        sleep(500);
    } else {
        sleep(100);
    }
}

function pushTask(serverUrl, postData) {
    var options = url.parse(serverUrl + '/pushTask');
    options.method = 'POST';
    options.headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
    return new Promise((resolve, rej) => {
        var req = http.request(options, (res) => {
            var rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    if (res.statusCode != 200) {
                        throw new Error(statusCode);
                    }
                    resolve(rawData);
                } catch (err) {
                    rej({ err, rawData });
                }
            });
        });
        req.write(postData);
        req.end();
    });
}

function pullTask(serverUrl) {
    serverUrl += '/pullTask';
    return new Promise((resolve, rej) => {
        http.get(serverUrl, (res) => {
            var rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    var task = JSON.parse(rawData);
                    resolve(task);
                } catch (err) {
                    rej({ err, rawData });
                }
            });
        });
    });
}

// class Task {
//     constructor() {
//         return {
//             complete: false,
//             range: { start: 1, stop: 10000 },
//             last: 5000,
//             lock: false,
//             index: new ObjectID(),
//             err: []
//         };
//     }
// }