console.log('started');
declare function require(name:string);
import https = require('https');
import http = require('http');
import util = require('util');
import path = require('path');
var url = require('url');
import fs = require('fs');
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
        host: 'pangea.de'//,
    },
    headers: {
        host: 'pangea.de'
    }//,
    //ssl: {
    //    key: fs.readFileSync(path.join(testDir, 'agent2-key.pem'), 'utf8'),
    //    cert: fs.readFileSync(path.join(testDir, 'agent2-cert.pem'), 'utf8')
    //}
};
// E.g. http://localhost:1333/advanced/kml.php?q=dsdp+39-355&amp;minlat=&amp;minlon=&amp;maxlat=&amp;maxlon=&amp;mindate=&amp;maxdate=&amp;env=All&amp;phpsessid=213834ebc6ee8df47829de0941339755&mode=gmap&count=125&ie=UTF-8
// E.g. http://utig.azurewebsites.net/advanced/kml.php?q=dsdp+39-355&amp;minlat=&amp;minlon=&amp;maxlat=&amp;maxlon=&amp;mindate=&amp;maxdate=&amp;env=All&amp;phpsessid=213834ebc6ee8df47829de0941339755&mode=gmap&count=125&ie=UTF-8
var proxyServer = new httpProxy.createProxyServer(options); 
var proxy = http.createServer((req, res) => {
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