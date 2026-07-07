import mongoose from "mongoose";

const packageSectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    packages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Package",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

packageSectionSchema.index({ isDeleted: 1 });
packageSectionSchema.index({ isActive: 1 });

const PackageSection = mongoose.model("PackageSection", packageSectionSchema);

export default PackageSection;
