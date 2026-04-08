const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // for POST JSON

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ✅ Store latest data
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


// ==============================
// ✅ ESP32 → SEND DATA (GET)
// ==============================
app.get("/update", (req, res) => {
  latestData = {
    solar: parseFloat(req.query.solar) || 0,
    wind: parseFloat(req.query.wind) || 0,
    battery: parseFloat(req.query.battery) || 0,
    current: parseFloat(req.query.current) || 0,
    r1: req.query.r1 || "OFF",
    r2: req.query.r2 || "OFF",
    r3: req.query.r3 || "OFF",
    on: parseInt(req.query.on) || 0,
    off: parseInt(req.query.off) || 0
  };

  console.log("📡 ESP32 Data:", latestData);

  // 🔥 Send to frontend (real-time)
  io.emit("data", latestData);

  res.send("OK");
});


// ==============================
// ✅ ESP32 → SEND DATA (POST JSON)
// ==============================
app.post("/update", (req, res) => {
  latestData = req.body;

  console.log("📡 ESP32 POST:", latestData);

  io.emit("data", latestData);

  res.json({ status: "OK" });
});


// ==============================
// ✅ FRONTEND → GET DATA
// ==============================
app.get("/data", (req, res) => {
  res.json(latestData);
});


// ==============================
// ROOT ROUTE
// ==============================
app.get("/", (req, res) => {
  res.send("Smart Grid Backend Running");
});


// ==============================
// SOCKET.IO
// ==============================
io.on("connection", (socket) => {
  console.log("🔌 User connected");

  // Send latest data instantly
  socket.emit("data", latestData);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected");
  });
});


// ==============================
// SERVER START
// ==============================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});