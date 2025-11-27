/* server.js - NetPulse POC (clean final version) */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public folder
app.use(express.static('public'));

// Socket.io events
io.on('connection', socket => {
  console.log('client connected:', socket.id);

  socket.on('join', ({ role, name }) => {
    socket.data.role = role;
    socket.data.name = name || 'student';

    if (role === 'teacher') {
      socket.join('teachers');
      console.log('teacher joined:', socket.id);
    } else {
      io.to('teachers').emit('student-join', {
        id: socket.id,
        name: socket.data.name
      });
      console.log('student joined:', socket.data.name);
    }
  });

  socket.on('heartbeat', ({ seq, t0 }) => {
    socket.emit('pong', { seq, t0 });

    if (socket.data.role === 'student') {
      const now = Date.now();
      const rtt = now - t0;

      io.to('teachers').emit('telemetry', {
        id: socket.id,
        name: socket.data.name,
        seq,
        rtt,
        ts: now
      });
    }
  });

  socket.on('disconnect', () => {
    if (socket.data.role === 'student') {
      io.to('teachers').emit('student-leave', { id: socket.id });
    }
    console.log('client disconnected:', socket.id);
  });
});

// IMPORTANT: allow access from iPad/phone
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});






