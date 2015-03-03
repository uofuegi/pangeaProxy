console.log('started');
var https = require('https'),
    http = require('http'),
    util = require('util'),
    path = require('path'),
    url = require('url');
fs = require('fs'),
httpProxy = require('http-proxy'),
log4js = require('log4js'),
testDir = path.join(__dirname, 'test', 'ssl');
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
            //category: ['startup','console']
        }
    ],
    replaceConsole: true
});
var logger = log4js.getLogger('testing');
//logger.setLevel('INFO');
console.log("logger retrieved");
logger.info("requires loaded");
//var port = 80;
var port = process.env.port || 1333;
var options = {
    target: {
        host: 'maps.ngdc.noaa.gov'//,
    },
    headers: {
        host: 'maps.ngdc.noaa.gov'
    }//,
    //ssl: {
    //    key: fs.readFileSync(path.join(testDir, 'agent2-key.pem'), 'utf8'),
    //    cert: fs.readFileSync(path.join(testDir, 'agent2-cert.pem'), 'utf8')
    //}
};
//var proxy = httpProxy.createServer(options).listen(port);
var proxies = {
    'ngdc': { site: 'maps.ngdc.noaa.gov' },
    'pangea': { site: 'pangea.de' },
    'utig': { site: 'www.ig.utexas.edu' }
};
for (context in proxies) {
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
// E.g. localhost:1333/ngdc/arcgis/rest/services
var proxy = http.createServer(function (req, res) {
    logger.info("url: " + req.url);

    //grab the first thing in the url. This will tell us what to proxy
    // E.g. With localhost:1333/ngdc/arcgis/rest/services the context will be ngdc
    var urlArray = req.url.split('/');
    context = urlArray[1],
    subdomain = req.headers.host.split('.')[0];
    logger.info("subdomain: " + req.headers.host.split('.')[0]);
    if (proxies[context]) {
        //remove the part of the url that tells us what to proxy
        // E.g. With localhost:1333/ngdc/arcgis/rest/services has the url /ngdc/arcgis/rest/services but we want to proxy /arcgis/rest/services
        res.oldWriteHead = res.writeHead;
        res.writeHead = function (statusCode, headers) {
            /* add logic to change headers here */
            //var contentType = res.getHeader('content-type');
            res.setHeader('Set-Cookie', "proxy=" + context);
            logger.info("header", 'start');
            logger.info("header", res.getHeader('proxy'));
            logger.info("header", 'end');
            // old way: might not work now
            // as headers param is not always provided
            // https://github.com/nodejitsu/node-http-proxy/pull/260/files
            // headers['foo'] = 'bar';       

            res.oldWriteHead(statusCode, headers);
        }
        //res.setHeader('proxy', context);
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
        proxies["utig"].proxyServer.web(req, res);
    }
}).listen(port);
proxy.on("error", function () {
    logger.error("error!!!");
});
proxy.on('proxyReq', function () {
    logger.info("proxy inbound");
});
logger.info('listening port: ' + port);
