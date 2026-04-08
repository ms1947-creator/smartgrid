const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Create server
const server = http.createServer(app);

// Socket setup
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store latest data
let latestData = {
  solar: 0,
  wind: 0,
  battery: 0,
  current: 0,
  r1: "OFF",
  r2: "OFF",
  r3: "OFF",
  on: 0,
  off: 0
};

// API to receive ESP32 data
app.get("/update", (req, res) => {
  latestData = {
    solar: req.query.solar,
    wind: req.query.wind,
    battery: req.query.battery,
    current: req.query.current,
    r1: req.query.r1,
    r2: req.query.r2,
    r3: req.query.r3,
    on: req.query.on,
    off: req.query.off
  };

  console.log("Received:", latestData);

  // Send to all connected frontend clients
  io.emit("data", latestData);

  res.send("OK");
});

// Root route
app.get("/", (req, res) => {
  res.send("Smart Grid Backend Running");
});

// Socket connection
io.on("connection", (socket) => {
  console.log("User connected");

  // Send latest data immediately
  socket.emit("data", latestData);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// PORT (IMPORTANT for Render)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});