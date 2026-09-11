const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth-middleware");
const upload = require("../middleware/upload-middleware");
const { uploadPostController, getMyPosts, getFeedPosts, getPostsByUserId,deletePostController} = require("../controller/post-controller");

router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadPostController
);


router.get("/my-posts", authMiddleware, getMyPosts);
router.get("/feed", authMiddleware, getFeedPosts);
router.get("/user/:userId", authMiddleware, getPostsByUserId);
router.delete("/:id", authMiddleware, deletePostController);



module.exports = router;
