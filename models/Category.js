import mongoose from "mongoose";
import { APPLIES_TO_VALUES } from "../utils/constants.js";

const categorySchema = new mongoose.Schema({
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  appliesTo: {
    type: [String],
    required: true,
    enum: APPLIES_TO_VALUES,
    default: ["package"]
  }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
