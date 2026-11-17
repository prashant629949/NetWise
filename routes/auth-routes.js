const express = require('express');
const { registerUser, loginUser, changePassword, deleteAccount,updateUsername } = require('../controller/auth-controller');
const authmiddleware = require("../middleware/auth-middleware");
const router = express.Router();
const { prisma } = require('../database/db');

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

        const users = await prisma.user.findMany({ where: { username: { contains: q.trim(), mode: 'insensitive' } }, select: { id: true, username: true, profileImage: true } });
        const posts = await prisma.post.findMany({ where: { caption: { contains: q.trim(), mode: 'insensitive' } }, select: { id: true, mediaUrl: true, mediaType: true, caption: true, uploadedBy: true, createdAt: true, user: { select: { id: true, username: true, profileImage: true } } } });

        res.json({
            success: true,
            users: users.map(({ id, ...user }) => ({ ...user, _id: id })),
            posts: posts.map(({ user, ...post }) => ({ ...post, _id: post.id, uploadedBy: user ? { ...user, _id: user.id } : null }))
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Search error" });
    }
});

router.get("/user/:id", authmiddleware, async (req, res) => {
    try {
      const found = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, username: true, profileImage: true } });
      const user = found ? { ...found, _id: found.id } : null;
  
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
