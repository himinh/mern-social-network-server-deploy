"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _app = _interopRequireDefault(require("./app"));

var _config = require("./config");

require("colors");

var _socket = require("socket.io");

var _socketEvents = require("./utils/socketEvents");

// Run app
var server = _app["default"].listen(_config.config.port, _config.logger.info("Server running in ".concat(_config.config.env, " mode on port ").concat(_config.config.port).cyan.underline)); // Socket


var io = new _socket.Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: 'http://localhost:3000'
  }
});
io.on('connection', function (socket) {
  // logger.info('Connected to socket io.')
  // Setup
  socket.on(_socketEvents.EVENTS.setup, function (user) {
    socket.join(user.id);

    _config.logger.info("user ".concat(user.id));

    socket.emit(_socketEvents.EVENTS.connected);
  }); // Join chat

  socket.on(_socketEvents.EVENTS.joinChat, function (chat) {
    return socket.join(chat);
  }); // Rename chat

  socket.on(_socketEvents.EVENTS.renameChat, function (_ref) {
    var chatId = _ref.chatId,
        newChatName = _ref.newChatName;
    return socket.to(chatId).emit(_socketEvents.EVENTS.renameChat, {
      chatId: chatId,
      newChatName: newChatName
    });
  }); // Typing

  socket.on(_socketEvents.EVENTS.typing, function (room) {
    return socket.to(room).emit(_socketEvents.EVENTS.typing);
  });
  socket.on(_socketEvents.EVENTS.stopTyping, function (room) {
    return socket.to(room).emit(_socketEvents.EVENTS.stopTyping);
  }); // Notification

  socket.on(_socketEvents.EVENTS.notificationReceived, function (userId) {
    return socket.to(userId).emit(_socketEvents.EVENTS.notificationReceived, userId);
  }); // New message

  socket.on(_socketEvents.EVENTS.newMessage, function (message) {
    var chat = message.chat;
    if (!chat.users) return _config.logger.error('chat.users not defined.');
    chat.users.forEach(function (user) {
      if (user === message.sender.id) return;
      socket.to(user).emit(_socketEvents.EVENTS.messageReceived, message);
    });
  });
}); // Handle unhandled promise rejections

var exitHandler = function exitHandler() {
  if (server) {
    server.close(function () {
      _config.logger.info('Server closed');

      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

var unexpectedErrorHandler = function unexpectedErrorHandler(error) {
  _config.logger.error(error);

  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);
process.on('SIGTERM', function () {
  _config.logger.info('SIGTERM received');

  if (server) {
    server.close();
  }
});