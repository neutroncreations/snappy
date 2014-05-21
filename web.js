var fs=require('fs');
var http = require('http');
var phantom = require('node-phantom');
var Router = require('node-simple-router');

var router = Router();

router.get("/", function(request, response) {

  var headers = {
    'Content-type': 'image/png'
  };

  if (request.get.download) {
    headers['Content-Disposition'] = 'attachment; filename="image.png"';
  }

  phantom.create(function (err,ph) {
    ph.createPage(function (err,page) {
      page.set('settings.customHeaders', {'Referer': request.get.url}, function(err) {
        page.set('settings.userAgent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.1995.2 Safari/537.36', function(err) {
          page.setViewport({ width: request.get.width || 1024, height: 768 }, function(err){
            var resourceCount = 0;
            var timeout;

            page.onResourceRequested = function (ev) {
              resourceCount++;
              clearTimeout(timeout);
              // console.log('request', resourceCount);
            }

            page.onResourceReceived = function (ev) {
              if (ev.stage == 'end') {
                resourceCount--;
                // console.log('receive', resourceCount);
                if (resourceCount <= 0) {

                  clearTimeout(timeout);
                  timeout = setTimeout(function() {
                    console.log('Rasterising...')
                    page.renderBase64('png', function(err, imagedata){

                      response.writeHead(200, headers);
                      response.end(new Buffer(imagedata, 'base64'));

                      console.log("Finished rendering: ", request.get.url);

                      ph.exit();
                    });
                  }, 1000);
                }
              }
            };

            console.log("Started rendering: ", request.get.url);
            page.open(request.get.url, function (err, status) {
              // handler error here
            });
          });
        });
      });
    });
  });
});

var server = http.createServer(router);

server.listen(process.env.PORT);
