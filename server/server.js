import express from "express";
import { createServer } from "node:http";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import { connectDB } from "./src/db.js";
import { Message } from "./src/models/Message.js";

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS
  || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim());

const signJwt = promisify(jwt.sign);
const verifyJwt = promisify(jwt.verify);

const normalizeUsername = (value) => String(value || "").trim().slice(0, 40);

const createToken = (username) =>
  signJwt(
    { username },
    JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: JWT_EXPIRES_IN,
      subject: username,
    }
  );

const verifyToken = (token) => verifyJwt(token, JWT_SECRET, { algorithms: ["HS256"] });

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length);
};

const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  if (!token) return res.status(401).json({ message: "token requerido" });

  try {
    req.user = await verifyToken(token);
    next();
  } catch (err) {
    const status = err.name === "TokenExpiredError" ? 401 : 403;
    res.status(status).json({ message: "token inválido o expirado" });
  }
};

await connectDB();

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && CLIENT_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGINS },
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/auth/login", async (req, res) => {
  const username = normalizeUsername(req.body?.username);
  if (!username) return res.status(400).json({ message: "nombre requerido" });

  try {
    const token = await createToken(username);
    res.json({ token, user: { username } });
  } catch (err) {
    console.error("failed to create token", err.message);
    res.status(500).json({ message: "no se pudo iniciar sesión" });
  }
});

app.get("/messages", requireAuth, async (_req, res) => {
  const messages = await Message.find()
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();
  res.json(messages);
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("token requerido"));

  try {
    socket.user = await verifyToken(token);
    next();
  } catch {
    next(new Error("token inválido o expirado"));
  }
});

io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id} (${socket.user.username})`);

  socket.on("chat:message", async (payload) => {
    try {
      const saved = await Message.create({
        usuario: socket.user.username,
        texto: payload?.texto,
      });
      io.emit("chat:message", {
        _id: saved._id,
        usuario: saved.usuario,
        texto: saved.texto,
        createdAt: saved.createdAt,
      });
    } catch (err) {
      console.error("failed to save message", err.message);
      socket.emit("chat:error", { message: "no se pudo guardar el mensaje" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
