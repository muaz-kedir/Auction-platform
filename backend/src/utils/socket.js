let io = null;

const initSocket = (socketInstance) => {
  io = socketInstance;
};

const getSocket = () => {
  return io;
};

module.exports = { initSocket, getSocket };
