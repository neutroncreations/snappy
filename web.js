var fs=require('fs');
var http = require('http');
var phantom = require('node-phantom');
var Router = require('node-simple-router');

var router = Router();

router.get("/", function(request, response) {

  phantom.create(function (err,ph) {
    ph.createPage(function (err,page) {
      page.customHeaders = {'Referer': request.get.url};
      page.set('settings.userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.1995.2 Safari/537.36');
      page.setViewport({ width: request.get.width || 1024, height: 768 }, function(err){
        page.open(request.get.url, function (err, status) {
          console.log("Started rendering: ", request.get.url);

          setTimeout(function(){
            page.renderBase64('png', function(err, imagedata){

              response.writeHead(200, {
                'Content-type': 'image/png'
              });
              response.end(new Buffer(imagedata, 'base64'));

              console.log("Finished rendering: ", request.get.url);

              ph.exit();
            });
          }, 2000);
        });
      });
    });
  });
});

var server = http.createServer(router);

server.listen(process.env.PORT);
