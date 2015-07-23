console.log('started');
var http = require('http');
var path = require('path');
var url = require('url');
var fs = require('fs');
var httpProxy = require('http-proxy');
var log4js = require('log4js');
var testDir = path.join(__dirname, 'test', 'ssl');
console.log("configure log4js");
var logDir = "./logs";
if (!fs.existsSync(logDir)) {
    console.log("no log folder");
    fs.mkdirSync(logDir);
}
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            type: 'file',
            filename: 'logs/startup.log',
            "maxLogSize": 20480,
            "backups": 3
        }
    ],
    replaceConsole: true
});
var logger = log4js.getLogger('testing');
console.log("logger retrieved");
logger.info("requires loaded");
var port = process.env.port || 1333;
var options = {
    target: {
        host: 'pangea.de'
    },
    headers: {
        host: 'pangea.de'
    }
};
var proxyServer = new httpProxy.createProxyServer(options);
var proxy = http.createServer(function (req, res) {
    logger.info("url: " + req.url);
    proxyServer.web(req, res);
}).listen(port);
proxy.on("error", function () {
    logger.error("error!!!");
});
proxy.on('proxyReq', function () {
    logger.info("proxy inbound");
});
logger.info('listening port: ' + port);
//# sourceMappingURL=server.js.map