import mongoose from "mongoose";

// Sub-schema for day activities
const activityDetailSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String },
  description: { type: String },
  price: { type: String }, // e.g. "Free" or "$50"
  isIncluded: { type: Boolean, default: true }
}, { _id: false });

// Sub-schema for day-by-day itineraries
const scheduleItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  activities: { type: [activityDetailSchema], default: [] }
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
  categories: {
    type: [String],
    default: []
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  mainLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true
  },
  locations: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location"
    }],
    default: []
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
  days: {
    type: Number,
    required: true,
    min: 1
  },
  nights: {
    type: Number,
    required: true,
    min: 0
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
