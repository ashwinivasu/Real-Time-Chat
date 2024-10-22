// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

const users = {}; // Store users by room

app.use(cors()); // Allow CORS for all origins

io.on('connection', (socket) => {
  socket.on('joinRoom', ({ room, username }) => {
    socket.join(room);

    // Add user to the room
    if (!users[room]) {
      users[room] = [];
    }
    users[room].push(username);

    // Emit updated online users to the room
    io.to(room).emit('onlineUsers', users[room]);

    // Listen for messages
    socket.on('sendMessage', (data) => {
      io.to(room).emit('message', data);
    });

    // Handle typing
    socket.on('typing', (data) => {
      socket.to(room).emit('typing', data);
    });

    // Remove user on disconnect
    socket.on('disconnect', () => {
      users[room] = users[room].filter(user => user !== username);
      io.to(room).emit('onlineUsers', users[room]);
    });
  });
});

// Server setup
server.listen(5000, () => {
  console.log('Server running on port 5000');
});
