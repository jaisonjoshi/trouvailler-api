import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 5005;
const HOST = process.env.HOST || "0.0.0.0";
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, HOST, () => {
      // eslint-disable-next-line no-console
      console.log("========================================");
      // eslint-disable-next-line no-console
      console.log("Trouvailler API Started");
      // eslint-disable-next-line no-console
      console.log("========================================");
      // eslint-disable-next-line no-console
      console.log("Connected to MongoDB Atlas successfully");
      // eslint-disable-next-line no-console
      console.log(`Environment : ${process.env.NODE_ENV || "development"}`);
      // eslint-disable-next-line no-console
      console.log(`Listening   : http://${HOST}:${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Docs        : http://${HOST}:${PORT}/docs`);
      // eslint-disable-next-line no-console
      console.log(`Health      : http://${HOST}:${PORT}/health`);
      // eslint-disable-next-line no-console
      console.log("========================================");
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  });
