/* NetPulse — Final Server.js (Works on Railway, Mac, iPhone) */

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Allow Railway / WebSockets
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

// Serve the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Root → student.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student.html'));
});

// Teacher shortcut
app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
});

/* SOCKET LOGIC */
io.on('connection', socket => {
  console.log('client connected:', socket.id);

  socket.on('join', ({ role, name }) => {
    socket.data.role = role;
    socket.data.name = name || 'student';

    if (role === 'teacher') {
      socket.join('teachers');
      console.log('teacher joined');
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

/* Railway port */
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});