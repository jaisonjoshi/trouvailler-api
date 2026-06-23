import mongoose from "mongoose";

// Sub-schema for day activities
const activityDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  description: { type: String },
  price: { type: String }, // e.g. "Free" or "$50"
  isIncluded: { type: Boolean, default: true },
  day: { type: Number, required: true }
}, { _id: false });

// Sub-schema for day-by-day itineraries
const scheduleItemSchema = new mongoose.Schema({
  dayTitle: { type: String, required: true },
  dayDesc: { type: String, required: true }
}, { _id: false });

// Sub-schema for Search Engine Optimization metadata
const seoSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  keywords: { type: String, default: "" }
}, { _id: false });

const packageSchema = new mongoose.Schema({
  destinationId: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true // e.g. "Italy, Europe" or "Kashmir, India"
  },
  image: {
    type: String,
    required: true // Cover image URL
  },
  images: {
    type: [String],
    default: [] // Gallery slide URLs
  },
  description: {
    type: String,
    required: true // Main package description copy
  },
  price: {
    type: Number,
    required: true // Numeric price for calculations/discounts
  },
  originalPrice: {
    type: Number // Strike-out original price (optional)
  },
  duration: {
    type: String,
    required: true // e.g. "5 Days / 4 Nights"
  },
  shortDuration: {
    type: String // Optional: e.g. "5D / 4N" for small mobile badges
  },
  accommodation: {
    type: String,
    required: true // e.g. "4★ Sea-View Hotel"
  },
  excursions: {
    type: String,
    required: true // e.g. "Boat Cruise & Ravello Tour"
  },
  meals: {
    type: String,
    required: true // e.g. "Breakfast & Dinner"
  },
  schedule: {
    type: [scheduleItemSchema],
    default: [] // Detailed day-by-day itinerary
  },
  activities: {
    type: [activityDetailSchema],
    default: [] // List of specific daily events/tours
  },
  inclusions: {
    type: [String],
    default: [] // Text bullets builder for inclusions
  },
  exclusions: {
    type: [String],
    default: [] // Text bullets builder for exclusions
  },
  seo: {
    type: seoSchema,
    default: () => ({})
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

const Package = mongoose.model("Package", packageSchema);

export default Package;
