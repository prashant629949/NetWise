const image = require('../model/image');
const User = require('../model/user');
const cloudinary = require("cloudinary").v2;
const { uploadToCloudinary } = require('../helper/cloudinary-helper');

// Upload image
const uploadProfileImageController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile image is required"
      });
    }

    // ONLY image allowed for profile
    if (!req.file.mimetype.startsWith("image")) {
      return res.status(400).json({
        success: false,
        message: "Only images allowed for profile picture"
      });
    }

    const { url, publicId } = await uploadToCloudinary(req.file.path, "image");

    // Save image record (optional but you already use it)
    await image.create({
      url,
      publicId,
      type: "image",
      uploadedBy: req.userInfo.userId,
    });

    //UPDATE PROFILE PIC (THIS IS CORRECT HERE)
    await User.findByIdAndUpdate(req.userInfo.userId, {
      profileImage: url
    });

    res.status(200).json({
      success: true,
      message: "Profile picture updated",
      profileImage: url
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// Fetch only logged-in user's uploaded media (images/videos)
const fetchalltheImages = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    // Populate username & profilePic
    const media = await image.find({ uploadedBy: userId })
      .populate("uploadedBy", "username profileImage _id")
      .sort({ createdAt: -1 });

    if (!media || media.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No media found for this user",
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: media
    });

  } catch (error) {
    console.error("Error fetching user media:", error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching media'
    });
  }
};

// Fetch other users' images/videos
const fetchAllOtherImages = async (req, res) => {
  try {
    const userId = req.userInfo.userId;

    // Get all media except current user's uploads
    const images = await image.find({ uploadedBy: { $ne: userId } })
      .populate("uploadedBy", "username profileImage _id")
      .sort({ createdAt: -1 });

    if (!images || images.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No other users' media found",
        data: []
      });
    }

    // Use user.profilePic if available, otherwise fallback to their last uploaded image
    const updatedImages = await Promise.all(
      images.map(async (img) => {
        if (!img.uploadedBy || !img.uploadedBy._id) return null;

        let profileImage = img.uploadedBy.profileImage;

        // fallback if profilePic is not set
        if (!profileImage || profileImage === "default.png") {
          const latestImage = await image.findOne({ uploadedBy: img.uploadedBy._id })
          .populate("uploadedBy", "username profileImage _id")
            .sort({ createdAt: -1 });
          profileImage = latestImage?.url || "default.png";
        }

        return {
          userId: img.uploadedBy._id.toString(),
          postUrl: img.url,
          username: img.uploadedBy.username,
          profileImage,
          type: img.type || "image",
        };
      })
    );

    const filteredImages = updatedImages.filter(Boolean);

    res.status(200).json({
      success: true,
      data: filteredImages,
    });

  } catch (error) {
    console.error("Error fetching other users' images:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching other users' media",
    });
  }
};

const deleteImageController = async (req, res) => {
  try {
    const imageId = req.params.id;
    const userId = req.userInfo.userId;

    // Find image
    const Image = await image.findById(imageId);

    if (!Image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Allow delete ONLY if owner
    if (Image.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this image",
      });
    }

    // Delete from Cloudinary
    if (Image.publicId) {
      await cloudinary.uploader.destroy(Image.publicId);
    }

    // Delete from MongoDB
    await image.findByIdAndDelete(imageId);

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });

  } catch (err) {
    console.error("DELETE IMAGE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Try again.",
    });
  }
};



module.exports = { uploadProfileImageController, fetchalltheImages, fetchAllOtherImages,deleteImageController };
