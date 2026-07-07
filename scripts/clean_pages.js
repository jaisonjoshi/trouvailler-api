import mongoose from "mongoose";
import dotenv from "dotenv";
import Page from "../models/Page.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function clean() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Delete all pages where slug is not "home"
    const result = await Page.deleteMany({ slug: { $ne: "home" } });
    console.log(`Deleted ${result.deletedCount} pages from the database.`);

    // Check remaining pages
    const remaining = await Page.find({});
    console.log("Remaining pages in database:", remaining.map(p => p.slug));

    console.log("Database cleanup completed successfully!");
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

clean();
