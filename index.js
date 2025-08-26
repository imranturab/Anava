const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "anony",
  password: "MyNewPassword123!",
  port: 5432,
});

app.use(cors());
app.use(express.json());

// API to fetch latest messages
app.get("/messages", async (req, res) => {
  const result = await pool.query("SELECT * FROM messages ORDER BY timestamp DESC limit 10");
  res.json(result.rows.reverse());
});

// Socket.io
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send_message", async (text) => {
    const result = await pool.query("INSERT INTO messages(text) VALUES($1) RETURNING *", [text]);
    io.emit("receive_message", result.rows[0]);
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));
