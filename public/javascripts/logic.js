var socket = io.connect();
var incblock = '';
socket.on('connected', function(data) {
    console.log(data);
    socket.emit('message', {msg: 'hogehoge'});
    socket.on('inc', function(msg) {
	console.log(msg.count);
	incblock.innerHTML = msg.count;
    });
});

window.onload = function() {
    incblock = $('#increment')[0];
};
