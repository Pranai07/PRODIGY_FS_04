require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const socketHandler = require("./socket/socketHandler");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://chatz-silk.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available to Express controllers
app.set("io", io);

// Initialize Socket.IO events
socketHandler(io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});