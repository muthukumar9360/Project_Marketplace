const Setting = require('../models/Setting');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Customer can join a room specific to their requestId
    socket.on('join_request_room', (requestId) => {
      socket.join(`request_${requestId}`);
    });
    
    // Admin needs to authenticate to join admin room (simplified for V1)
    socket.on('join_admin_room', async (credentials) => {
      try {
        const settings = await Setting.findOne({ globalId: 'global' });
        const adminUsername = settings?.adminUsername || 'muthukumar_9360';
        const adminPassword = settings?.adminPassword || 'Muthukumar@9360';

        if (credentials && 
            credentials.username === adminUsername && 
            credentials.password === adminPassword) {
          socket.join('admin_room');
          socket.emit('admin_joined', { success: true });
        } else {
          socket.emit('admin_joined', { success: false, error: 'Unauthorized' });
        }
      } catch (e) {
        socket.emit('admin_joined', { success: false, error: 'Database error' });
      }
    });

    socket.on('disconnect', () => {
      // Cleanup happens automatically
    });
  });
};
