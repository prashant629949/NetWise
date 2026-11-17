const { prisma } = require('../database/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;
const { randomUUID } = require('crypto');

const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'Username, email, and password are required' });
    const exists = await prisma.user.findFirst({ where: { OR: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] } });
    if (exists) return res.status(400).json({ success: false, message: 'User already exist try with a diffrent username' });
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { id: randomUUID(), username: username.trim(), email: email.trim().toLowerCase(), password: hash } });
    res.status(200).json({ success: true, message: 'User register successfully' });
  } catch (e) {
    console.error(e);
    res.status(e.code === 'P2002' ? 400 : 500).json({ success: false, message: e.code === 'P2002' ? 'User already exist try with a diffrent username' : 'Something went wrong' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: 'Username and password are required' });
    if (!process.env.JWT_SECRET_KEY) return res.status(500).json({ success: false, message: 'JWT secret is not configured' });
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(400).json({ success: false, message: 'username is invalid' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: 'invalid password !' });
    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET_KEY, { expiresIn: '30m' });
    res.status(201).json({ success: true, message: 'login successfull', token });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'something went wrong' }); }
};

const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'Username is required' });
    const result = await prisma.user.updateMany({ where: { id: req.userInfo.userId }, data: { username: username.trim() } });
    if (!result.count) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'Username updated successfully' });
  } catch (e) { res.status(e.code === 'P2002' ? 400 : 500).json({ success: false, message: e.code === 'P2002' ? 'Username is already taken' : 'Server error' }); }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newpassword } = req.body;
    if (!oldPassword || !newpassword) return res.status(400).json({ success: false, message: 'Old password and new password are required' });
    const user = await prisma.user.findUnique({ where: { id: req.userInfo.userId }, select: { password: true } });
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!await bcrypt.compare(oldPassword, user.password)) return res.status(401).json({ success: false, message: 'Old Password Not Match! Please Try Again' });
    await prisma.user.update({ where: { id: req.userInfo.userId }, data: { password: await bcrypt.hash(newpassword, 10) } });
    res.json({ success: true, message: 'Password updated Successfully' });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'something went wrong' }); }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.userInfo.userId;
    const posts = await prisma.post.findMany({ where: { uploadedBy: userId } });
    const images = await prisma.image.findMany({ where: { uploadedBy: userId } });
    for (const post of posts) if (post.publicId) await cloudinary.uploader.destroy(post.publicId, { resource_type: post.mediaType === 'video' ? 'video' : 'image' });
    for (const image of images) if (image.publicId) await cloudinary.uploader.destroy(image.publicId);
    await prisma.user.delete({ where: { id: userId } });
    res.json({ success: true, message: 'Account and all data deleted successfully' });
  } catch (err) { console.error('DELETE ACCOUNT ERROR:', err); res.status(500).json({ success: false, message: 'Failed to delete account' }); }
};

module.exports = { registerUser, loginUser, changePassword, deleteAccount, updateUsername };
