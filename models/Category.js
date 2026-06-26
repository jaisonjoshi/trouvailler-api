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
    type: [{
      type: String,
      enum: APPLIES_TO_VALUES
    }],
    required: true,
    default: ["package"]
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

categorySchema.index({ slug: 1 });
categorySchema.index({ appliesTo: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isDeleted: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
