import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5005;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("Connected to MongoDB Atlas successfully");
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server is running on port ${PORT}`);
      // eslint-disable-next-line no-console
      console.log(`API Documentation available at http://localhost:${PORT}/docs`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
  });
