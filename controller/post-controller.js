const { prisma } = require('../database/db');
const { randomUUID } = require('crypto');
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require('../helper/cloudinary-helper');

const uploadPostController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
    const mediaType = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const { url, publicId } = await uploadToCloudinary(req.file.path, mediaType);
    const post = await prisma.post.create({ data: { id: randomUUID(), mediaUrl: url, publicId, mediaType, caption: req.body.caption || '', uploadedBy: req.userInfo.userId } });
    res.json({ success: true, message: 'Post uploaded', post: { ...post, _id: post.id } });
  } catch (e) { console.error('POST UPLOAD ERROR:', e); res.status(500).json({ success: false, message: 'Post upload failed' }); }
};
const getMyPosts = async (req, res) => {
  try { const data = await prisma.post.findMany({ where: { uploadedBy: req.userInfo.userId }, orderBy: { createdAt: 'desc' } }); res.json({ success: true, data: data.map((post) => ({ ...post, _id: post.id })) }); }
  catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to fetch posts' }); }
};
const getFeedPosts = async (req, res) => {
  try { const data = await prisma.post.findMany({ include: { user: { select: { id: true, username: true, profileImage: true } } }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: data.map(({ user, ...post }) => ({ ...post, _id: post.id, uploadedBy: user ? { ...user, _id: user.id } : null })) }); }
  catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to load feed' }); }
};
const getPostsByUserId = async (req, res) => {
  try { const data = await prisma.post.findMany({ where: { uploadedBy: req.params.userId }, orderBy: { createdAt: 'desc' } }); res.json({ success: true, data: data.map((post) => ({ ...post, _id: post.id })) }); }
  catch (e) { res.status(500).json({ success: false }); }
};
const deletePostController = async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.uploadedBy !== req.userInfo.userId) return res.status(403).json({ success: false, message: 'Not allowed' });
    if (post.publicId) await cloudinary.uploader.destroy(post.publicId, { resource_type: post.mediaType === 'video' ? 'video' : 'image' });
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
};
module.exports = { uploadPostController, getMyPosts, getFeedPosts, getPostsByUserId, deletePostController };
