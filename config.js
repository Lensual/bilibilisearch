module.exports = {
    server: {
        enable: true,
        host: '0.0.0.0',
        port: 2233,
        mongodb: { addr: 'mongodb://localhost:27017/', dbname: 'bilibilisearch' },
        max: 30000000,
        clientlife: 60000,  //60sec
        tasksize: 50000
    },
    client: {
        enable: true,
        addr: "http://localhost:2233",
        heartbeat: 10000,
        retry: 5,
        blocksize: 10
    }
}