const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ["image", "video"],
      default: "image"
    },
    publicId: {
      type: String,
      required: true
    },
    usage: {
      type: String,
      enum: ["profile", "post"],
      default: "post" // 👈 IMPORTANT
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }, { timestamps: true });
  

module.exports=mongoose.model("image",imageSchema);