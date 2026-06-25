import mongoose from "mongoose";
import { LOCATION_LEVEL_VALUES } from "../utils/constants.js";

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  shortDescription: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true,
    enum: LOCATION_LEVEL_VALUES
  },
  parentLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    default: null
  },
  categories: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

const Location = mongoose.model("Location", locationSchema);

export default Location;
