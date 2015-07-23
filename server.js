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
        host: 'maps.ngdc.noaa.gov'
    },
    headers: {
        host: 'maps.ngdc.noaa.gov'
    }
};
var proxies = {
    'ngdc': { site: 'maps.ngdc.noaa.gov' },
    'pangea': { site: 'pangea.de' },
    'utig': { site: 'www.ig.utexas.edu' }
};
for (var context in proxies) {
    var url = proxies[context].site;
    proxies[context].proxyServer = new httpProxy.createProxyServer({
        target: {
            host: url
        },
        headers: {
            host: url
        }
    });
}
var proxy = http.createServer(function (req, res) {
    logger.info("url: " + req.url);
    var urlArray = req.url.split('/'), context = urlArray[1], subdomain = req.headers.host.split('.')[0];
    logger.info("subdomain: " + req.headers.host.split('.')[0]);
    if (proxies[context]) {
        res.oldWriteHead = res.writeHead;
        res.writeHead = function (statusCode, headers) {
            res.setHeader('Set-Cookie', "proxy=" + context);
            logger.info("header", 'start');
            logger.info("header", res.getHeader('proxy'));
            logger.info("header", 'end');
            res.oldWriteHead(statusCode, headers);
        };
        urlArray.splice(0, 2);
        var proxyUrl = "/" + urlArray.join('/');
        logger.info("proxyUrl:" + proxyUrl);
        req.url = proxyUrl;
        proxies[context].proxyServer.web(req, res);
    }
    else if (proxies[res.getHeader('proxy')]) {
        res.setHeader('proxyHeader', context);
        proxies[context].proxyServer.web(req, res);
    }
    else if (proxies[subdomain]) {
        logger.info("proxySubdomain: " + subdomain);
        proxies[subdomain].proxyServer.web(req, res);
    }
    else {
        proxies['pangea'].proxyServer.web(req, res);
    }
}).listen(port);
proxy.on("error", function () {
    logger.error("error!!!");
});
proxy.on('proxyReq', function () {
    logger.info("proxy inbound");
});
logger.info('listening port: ' + port);
//# sourceMappingURL=server.js.map