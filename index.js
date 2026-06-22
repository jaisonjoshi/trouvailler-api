import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { ZodError } from "zod";
import { apiReference } from "@scalar/express-api-reference";

import { swaggerSpec } from "./utils/swagger.js";
import packageRoutes from "./routes/PackageRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI;

// Enable CORS for all requests
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve raw OpenAPI JSON (optional helper endpoint)
app.get("/openapi.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Mount Scalar documentation reference under /docs
app.use(
  "/docs",
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: "purple",
  })
);

// Mount API routes
app.use("/api/packages", packageRoutes);

app.get("/", (req, res) => {
  res.send("Hello World from Trouvailler API Server with MongoDB! Head to /docs for API reference.");
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  console.error("Error caught in global handler:", err);
  
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

// Connect to MongoDB Atlas
if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation available at http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
  });

