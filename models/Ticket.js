import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    packageName: {
      type: String,
      required: true,
      trim: true,
    },
    packagePrice: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    travelers: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    contactMethod: {
      type: String,
      required: true,
      enum: ["email", "phone", "whatsapp"],
      default: "email",
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "contacted", "resolved", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ email: 1 });
ticketSchema.index({ createdAt: -1 });

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
