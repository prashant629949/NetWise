const Post = require("../model/post");
const Image = require("../model/image");
const cloudinary = require("cloudinary").v2;
const { uploadToCloudinary } = require("../helper/cloudinary-helper");

const getPublicIdFromCloudinaryUrl = (url) => {
    if (!url) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/);
    return match ? decodeURIComponent(match[1]) : null;
};

const uploadPostController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "File required"
            });
        }

        const type = req.file.mimetype.startsWith("video") ? "video" : "image";

        const { url, publicId } = await uploadToCloudinary(req.file.path, type);

        const post = await Post.create({
            mediaUrl: url,
            publicId,
            mediaType: type,
            caption: req.body.caption || "",
            uploadedBy: req.userInfo.userId
        });

        res.status(200).json({
            success: true,
            message: "Post uploaded",
            post
        });

    } catch (error) {
        console.error("POST UPLOAD ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Post upload failed"
        });
    }
};


const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({
            uploadedBy: req.userInfo.userId
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: posts
        });

    } catch (error) {
        console.error("Fetch posts error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch posts"
        });
    }
};

const getFeedPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("uploadedBy", "username profileImage")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: posts
        });

    } catch (err) {
        console.error("Feed error:", err);
        res.status(500).json({
            success: false,
            message: "Failed to load feed"
        });
    }
};

const getPostsByUserId = async (req, res) => {
    try {
        const posts = await Post.find({ uploadedBy: req.params.userId })
            .sort({ createdAt: -1 });

        res.json({ success: true, data: posts });
    } catch (e) {
        res.status(500).json({ success: false });
    }
};

const deletePostController = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userInfo.userId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.uploadedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }

    // Delete from Cloudinary
    const publicId = post.publicId || getPublicIdFromCloudinaryUrl(post.mediaUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: post.mediaType === "video" ? "video" : "image",
      });
    }

    await Post.findByIdAndDelete(postId);

    res.json({
      success: true,
      message: "Post deleted",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};





module.exports = { uploadPostController, getMyPosts, getFeedPosts,getPostsByUserId,deletePostController };
