import mongoose from "mongoose";
import { ZodError } from "zod";

export default function errorHandler(err, req, res, _next) {
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

  if (statusCode >= 500) {
    console.error("Error caught in global handler:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
}
