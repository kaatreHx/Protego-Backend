let ioInstance = null;

function init(io) {
  ioInstance = io;
}

module.exports = {
  init,
  emit: (...args) => ioInstance.emit(...args),
};
