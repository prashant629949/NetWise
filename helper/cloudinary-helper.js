const cloudinary = require('../config/cloudinary')

const uploadToCloudinary = async (filePath, fileType = "image") => {
    try {
      // Dynamically set resource type based on file type
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: fileType === "video" ? "video" : "image",
        folder: "netwise_uploads", // optional: organize uploads in one folder
      });
  
      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Error while uploading to Cloudinary:", error);
      throw new Error("Error while uploading to Cloudinary");
    }
  };
module.exports={
    uploadToCloudinary
}