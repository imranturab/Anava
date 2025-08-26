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

// Railway DB connection (DATABASE_URL env variable)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Railway/Postgres کے لئے ضروری
});

app.use(cors());
app.use(express.json());

// API to fetch latest messages
app.get("/messages", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM messages ORDER BY timestamp DESC limit 10");
    res.json(result.rows.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Socket.io
io.on("connection", (socket) => {
  console.log("✅ User connected");

  socket.on("send_message", async (text) => {
    try {
      const result = await pool.query(
        "INSERT INTO messages(text) VALUES($1) RETURNING *",
        [text]
      );
      io.emit("receive_message", result.rows[0]);
    } catch (err) {
      console.error("DB insert error:", err);
    }
  });
});

// Railway پورٹ ہمیشہ process.env.PORT سے لینا چاہیے
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
