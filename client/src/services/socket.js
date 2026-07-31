import { io } from "socket.io-client";

const socket = io("https://chatz-cgvo.onrender.com", {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket"],
});

export default socket;