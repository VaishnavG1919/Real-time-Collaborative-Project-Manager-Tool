const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Middleware: authenticate socket connections
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.name} (${socket.id})`);

    // Mark user online
    await User.findByIdAndUpdate(user._id, { isOnline: true });

    // Join user's personal room
    socket.join(`user:${user._id}`);

    // ── PROJECT ROOMS ─────────────────────────────────────────────
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user-joined', {
        userId: user._id,
        name: user.name,
        socketId: socket.id,
      });
      console.log(`📂 ${user.name} joined project room: ${projectId}`);
    });

    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);
      socket.to(`project:${projectId}`).emit('user-left', {
        userId: user._id,
        name: user.name,
      });
    });

    // ── TASK EVENTS ───────────────────────────────────────────────
    socket.on('task-created', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task-created', task);
    });

    socket.on('task-updated', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('task-updated', task);
    });

    socket.on('task-deleted', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('task-deleted', taskId);
    });

    socket.on('task-moved', ({ projectId, taskId, fromStatus, toStatus, task }) => {
      socket.to(`project:${projectId}`).emit('task-moved', {
        taskId,
        fromStatus,
        toStatus,
        task,
      });
    });

    // ── COMMENTS ──────────────────────────────────────────────────
    socket.on('comment-added', ({ projectId, task }) => {
      socket.to(`project:${projectId}`).emit('comment-added', task);
    });

    // ── TYPING INDICATORS ─────────────────────────────────────────
    socket.on('typing-start', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('typing-start', {
        userId: user._id,
        name: user.name,
        taskId,
      });
    });

    socket.on('typing-stop', ({ projectId, taskId }) => {
      socket.to(`project:${projectId}`).emit('typing-stop', {
        userId: user._id,
        taskId,
      });
    });

    // ── CURSOR / PRESENCE ─────────────────────────────────────────
    socket.on('cursor-move', ({ projectId, x, y }) => {
      socket.to(`project:${projectId}`).emit('cursor-move', {
        userId: user._id,
        name: user.name,
        x,
        y,
      });
    });

    // ── PROJECT EVENTS ────────────────────────────────────────────
    socket.on('project-updated', ({ projectId, project }) => {
      socket.to(`project:${projectId}`).emit('project-updated', project);
    });

    socket.on('member-added', ({ projectId, project }) => {
      io.to(`project:${projectId}`).emit('member-added', project);
    });

    // ── DISCONNECT ────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(user._id, { isOnline: false });
      io.emit('user-offline', { userId: user._id });
      console.log(`❌ ${user.name} disconnected`);
    });
  });
};

module.exports = socketHandler;