const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

http.listen(app.get('port'), function () {
  console.log(`servidor en puerto ${app.get('port')}`);
});

io.on('connection', function (socket) {
  console.log('new user connected');

  socket.on('mensajesDelCliente', function (data) {
    console.log(data);
    io.emit('mensajesDelServidor', data);
  });
});
