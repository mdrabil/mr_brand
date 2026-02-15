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

// const createDummyOrder = async () => {
//   try {
//     // Replace these IDs with real ObjectIds from your database
//     const dummyCustomerId = new mongoose.Types.ObjectId();
//     const dummyStoreId = new mongoose.Types.ObjectId();

//     const order = new Order({
//       customer: dummyCustomerId,
//       store: dummyStoreId,
//       items: [
//         {
//           productName: "Test Product 1",
//           variantLabel: "Size L",
//           sellingPrice: 500,
//           qty: 2,
//           gstPercent: 18,
//         },
//         {
//           productName: "Test Product 2",
//           variantLabel: "Color Red",
//           sellingPrice: 300,
//           qty: 1,
//           gstPercent: 12,
//         },
//       ],
//       totalAmount: 1300, // 500*2 + 300*1 = 1300
//       gstAmount: (500*2*0.18 + 300*1*0.12), // 180 + 36 = 216
//       payableAmount: 1516, // total + gst
//       deliveryAddress: {
//         fullAddress: "123, Test Street",
//         city: "Test City",
//         pincode: "123456",
//         latitude: 12.9716,
//         longitude: 77.5946,
//       },
//       status: "PLACED",
//     });

//     const savedOrder = await order.save();
//     console.log("Dummy order created:", savedOrder);
//     process.exit(0);
//   } catch (err) {
//     console.error("Error creating dummy order:", err);
//     process.exit(1);
//   }
// };

// createDummyOrder();

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
  console.log(`🚀 Server + Socket running on port ${config.port}`);
});
