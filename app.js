import express from "express";
import cors from "cors";
import { apiReference } from "@scalar/express-api-reference";

import { swaggerSpec } from "./utils/swagger.js";
import errorHandler from "./middleware/errorHandler.js";
import notFoundHandler from "./middleware/notFoundHandler.js";
import packageRoutes from "./routes/PackageRoutes.js";
import categoryRoutes from "./routes/CategoryRoutes.js";
import locationRoutes from "./routes/LocationRoutes.js";

const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(
  express.json({
    limit: "2mb",
  }),
);

app.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.use(
  "/docs",
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: "purple",
  }),
);

app.use("/api/packages", packageRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/locations", locationRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "Trouvailler API",
    status: "ok",
    docs: "/docs",
    openapi: "/openapi.json",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Trouvailler API",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
