const express = require('express');
const { v4: uuid } = require('uuid');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");

const PORT = process.env.PORT || 8000;

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000', 
      'https://fluuudy.vercel.app'
    ],
    methods: ["GET", "POST"],
  }
});

app.get('/', (req, res) => {
  res.send(JSON.stringify({'lalal': 'hello'}));
});

const messages = [];
const users = {};

io.on('connection', (socket) => {
  const userId = 'user__' + uuid();

  users[userId] = {
    connectionId: socket.id
  }

  io.to(socket.id).emit('getHistory', messages)
  io.emit('getOnlineUsers', users);

  socket.on('login', user => {
    users[userId].username = user.username;
    users[userId].avatar = user.userImg;
    
    io.to(socket.id).emit('getUser', users[userId])
    io.emit('getOnlineUsers', users);
  })

  socket.on('sendMessage', msg => {
    messages.unshift(msg);
    
    socket.broadcast.emit('getMessage', msg);
    io.to(socket.id).emit('getMessage', {...msg, isYour: true})
  });

  socket.on('disconnect', (reason) => {
    delete users[userId];
    socket.broadcast.emit('getOnlineUsers', users);
  })

});

server.listen(PORT, () => {
  console.log('listening on *: ' + PORT);
});
