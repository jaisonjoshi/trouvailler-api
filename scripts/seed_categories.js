import mongoose from "mongoose";
import dotenv from "dotenv";
import Category from "../models/Category.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const categoriesToSeed = [
  {
    name: "Honeymoon & Romantic",
    slug: "honeymoon-romantic-tours",
    description: "Curated romantic getaways, candle-lit dinners, and scenic escapes for couples.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80",
    appliesTo: ["package"],
    isActive: true,
  },
  {
    name: "Adventure & Treks",
    slug: "adventure-treks-tours",
    description: "Thrilling high-altitude treks, white-water rafting, and adrenaline-pumping expeditions.",
    image: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=600&q=80",
    appliesTo: ["package"],
    isActive: true,
  },
  {
    name: "Wildlife & Nature Safari",
    slug: "wildlife-nature-tours",
    description: "Discover exotic fauna, dense national park jungles, and pristine nature reserves.",
    image: "https://images.unsplash.com/photo-1547036967-23d11aacaee0?auto=format&fit=crop&w=600&q=80",
    appliesTo: ["package"],
    isActive: true,
  },
  {
    name: "Beach & Tropical Getaways",
    slug: "beach-getaways-tours",
    description: "Sun-kissed beaches, luxurious oceanfront villas, and tropical island retreats.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
    appliesTo: ["package"],
    isActive: true,
  },
  {
    name: "Heritage & Cultural tours",
    slug: "heritage-culture-tours",
    description: "Immerse in historic fortresses, ancient temple architecture, and vibrant local folklore.",
    image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=600&q=80",
    appliesTo: ["package"],
    isActive: true,
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB database.");

    for (const catData of categoriesToSeed) {
      // Upsert based on slug
      await Category.findOneAndUpdate(
        { name: catData.name },
        { $set: catData },
        { upsert: true, new: true }
      );
      console.log(`Upserted category: ${catData.name}`);
    }

    console.log("Category seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding categories:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seed();
