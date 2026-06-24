import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { ZodError } from "zod";
import { apiReference } from "@scalar/express-api-reference";

import { swaggerSpec } from "./utils/swagger.js";
import packageRoutes from "./routes/PackageRoutes.js";
import categoryRoutes from "./routes/CategoryRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

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
  })
);

app.use("/api/packages", packageRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Hello World from Trouvailler API Server with MongoDB! Head to /docs for API reference.");
});

app.use((err, req, res, next) => {
  console.error("Error caught in global handler:", err);

  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format",
    });
  }

  if (err instanceof ZodError || err.name === "ZodError") {
    const issues = err.errors || err.issues || [];
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: issues.map((e) => ({
        path: Array.isArray(e.path) ? e.path.join(".") : String(e.path),
        message: e.message,
      })),
    });
  }

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
