const express = require('express');
const { registerUser, loginUser, changePassword, deleteAccount,updateUsername } = require('../controller/auth-controller');
const authmiddleware = require("../middleware/auth-middleware");
const router = express.Router();
const User = require('../model/user');
const Post = require('../model/post');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/change-password", authmiddleware, changePassword);
router.delete("/delete-account", authmiddleware, deleteAccount);
router.put("/update-username",authmiddleware,updateUsername);
router.get("/search", async (req, res) => {
    try {
        const q = req.query.q;

        if (!q || q.trim() === "") {
            return res.json({ success: true, users: [], posts: [] });
        }

        const searchRegex = new RegExp(q, "i");

        // Search users
        const users = await User.find({
            username: searchRegex
        }).select("username profileImage _id");

        const posts = await Post.find({
            caption: searchRegex
        }).select("mediaUrl mediaType caption uploadedBy createdAt")
        .populate("uploadedBy", "username profileImage");

        res.json({
            success: true,
            users,
            posts
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Search error" });
    }
});

router.get("/user/:id", authmiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
        .select("username profileImage _id");
  
      if (!user) {
        return res.status(404).json({ success: false });
      }
  
      res.json({
        success: true,
        user
      });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });
  



module.exports = router;
