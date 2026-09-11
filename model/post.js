const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  mediaUrl: { type: String, required: true },
  publicId: { type: String, default: null },
  mediaType: { type: String, enum: ["image", "video"] },
  caption: { type: String, default: "" },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Post", postSchema);
