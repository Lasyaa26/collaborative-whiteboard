const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins for testing
  },
});

// Listen for connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Drawing event
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data); // send to all other clients
  });

  // Clear board event
  socket.on("clear", () => {
    socket.broadcast.emit("clear");
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
