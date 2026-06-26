import mongoose from "mongoose";
import { LOCATION_LEVEL_VALUES } from "../utils/constants.js";

const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
      enum: LOCATION_LEVEL_VALUES,
    },
    parentLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      default: null,
    },
    categories: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

locationSchema.index({ slug: 1 });
locationSchema.index({ parentLocation: 1 });
locationSchema.index({ categories: 1 });
locationSchema.index({ level: 1 });
locationSchema.index({ isActive: 1 });
locationSchema.index({ isDeleted: 1 });

const Location = mongoose.model("Location", locationSchema);

export default Location;
