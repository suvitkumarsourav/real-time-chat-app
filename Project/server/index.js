const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const rooms = {}; // roomName -> [userName]
const messages = {}; // roomName -> [{senderName, text}]

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomName, userName) => {
    socket.join(roomName);

    if (!rooms[roomName]) rooms[roomName] = [];
    rooms[roomName].push(userName);

    if (!messages[roomName]) messages[roomName] = [];

    // Notify everyone in room
    io.to(roomName).emit("active-users", rooms[roomName]);
    io.to(roomName).emit("user-joined", { userName });
  });

  socket.on("send-message", (msgObj) => {
    const { roomId } = msgObj;
    if (!messages[roomId]) messages[roomId] = [];
    messages[roomId].push(msgObj);

    io.to(roomId).emit("receive-message", msgObj);
  });

  socket.on("leave-room", (roomName, userName) => {
    if (rooms[roomName]) {
      rooms[roomName] = rooms[roomName].filter((u) => u !== userName);
      io.to(roomName).emit("active-users", rooms[roomName]);
      io.to(roomName).emit("user-left", { userName });
    }
    socket.leave(roomName);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    // Optional: handle users leaving rooms on disconnect
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
