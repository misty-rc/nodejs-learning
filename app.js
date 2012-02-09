/**
 * Module dependencies.
 */

var express = require('express'),
    form = require('connect-form'),
    socketio = require('socket.io'),
    xml2js = require('xml2js'),
    routes = require('./routes');

var app = module.exports = express.createServer(
    form({keepExtensions: true})
);

// Configuration

app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    //app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session({ secret: "minimalistic ubuntu" }));
    app.use(app.router);

    app.use(form());
    app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
    app.use(express.errorHandler()); 
});

// Routes

//app.get('/', routes.index);

var http = require('http');
var options = {
    host: 'h.livetube.cc',
    port: 80,
    path: '/index.live.xml',
    method: 'GET'
};
var parser = new xml2js.Parser();

app.get('/upload', function(req, res) {
    console.log('upload method');
    var body = '';
    var livetubeTitle = '';
    var livetube = http.request(options, function(ls) {
	ls.on('data', function(chunk) {
	    body += chunk;
	});
	ls.on('end', function() {
	    parser.parseString(body, function(err, result) {
		console.log(result.title);
		livetubeTitle = result.title;
		res.render('index', {title: 'uploader', livetubeTitle: livetubeTitle});

	    });
	});
    });
    livetube.on('error', function(err) {
	console.log(err.message);
    });
    livetube.end();
});

app.post('/upload', function(req, res, next) {
    req.form.complete(function(err, fields, files) {
	if(err) {
	    next(err);
	} else {
	    console.log('\nuploaded: %s to %s',
			files.image.filename,
			files.image.path);
	    res.redirect('back');
	}
    });

    req.form.on('progress', function(bytesReceived, bytesExpected) {
	var percent = (bytesReceived / bytesExpected * 100) | 0;
	process.stdout.write('uploading: %' + percent + '\r');
    });

});

app.listen(3000, function() {
    console.log("listening on port %d in %s mode", app.address().port, app.settings.env);
});

var io = socketio.listen(app);
var interval = '';

io.sockets.on('connection', function(client) {
    console.log(client.id + ' is incoming');
    client.emit('connected', {status: true});
    
    client.on('message', function(msg) {
	console.log(client.id + ' is messaging : ' + msg.msg);
    });

    client.on('disconnect', function() {
	clearInterval(interval);
	console.log(client.sessionId + ' is disconnected');
    });
    var count = 1;
    interval = setInterval(function() {
	console.log('emit' + count);
	client.emit('inc', {count: count++});
    }, 1000);
});