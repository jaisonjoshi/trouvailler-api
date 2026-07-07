import mongoose from "mongoose";

const pageSectionConfigSchema = new mongoose.Schema({
  packageSectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PackageSection",
  },
  locationSectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LocationSection",
  },
  categorySectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CategorySection",
  },
});

const pageSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "package-carousel",
      "location-carousel",
      "category-carousel",
      "navbar",
      "hero-header",
      "footer",
    ],
  },
  title: {
    type: String,
    trim: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  },
  config: pageSectionConfigSchema,
});

const seoSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: { type: String, default: "" },
  },
  { _id: false },
);

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["system", "location", "category"],
      default: "system",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    sections: [pageSectionSchema],
    seo: {
      type: seoSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

pageSchema.index({ slug: 1 }, { unique: true });
pageSchema.index({ isDeleted: 1 });

const Page = mongoose.model("Page", pageSchema);

export default Page;
