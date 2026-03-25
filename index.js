import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from './src/routes/mainRoutes.js'
import { connectDB } from "./src/config/db.js";
import { config } from "./src/config/config.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import { initSocket } from "./src/sockets/socket.js";
import { runInitialSeeder } from "./src/seeders/initialSeeder.js";

const app = express();
const server = http.createServer(app);

// 🔐 Security
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// DB
connectDB();
// runInitialSeeder()



// Routes
app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "API running 🚀" });
});

// Error handler (LAST)
app.use(errorHandler);

// 🔌 Socket init (future ready)
initSocket(server);

server.listen(config.port, () => {
  console.log(`Server + Socket running on port ${config.port}`);
});
