import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes";

import {
  notFoundHandler,
  errorHandler
} from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true
  })
);

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

app.get("/", (_req, res) => {
  res.json({
    success: true,
    name: "DealFlow360 API",
    version: "0.1.0",
    status: "running"
  });
});

app.use(
  "/api/health",
  healthRoutes
);

app.use(notFoundHandler);

app.use(errorHandler);

export default app;