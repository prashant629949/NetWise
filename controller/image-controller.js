const { prisma } = require('../database/db');
const { randomUUID } = require('crypto');
const cloudinary = require('cloudinary').v2;
const { uploadToCloudinary } = require('../helper/cloudinary-helper');

const uploadProfileImageController = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Profile image is required' });
    if (!req.file.mimetype.startsWith('image')) return res.status(400).json({ success: false, message: 'Only images allowed for profile picture' });
    const { url, publicId } = await uploadToCloudinary(req.file.path, 'image');
    await prisma.$transaction([
      prisma.image.create({ data: { id: randomUUID(), url, publicId, type: 'image', usage: 'profile', uploadedBy: req.userInfo.userId } }),
      prisma.user.update({ where: { id: req.userInfo.userId }, data: { profileImage: url } }),
    ]);
    res.json({ success: true, message: 'Profile picture updated', profileImage: url });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Upload failed' }); }
};

const fetchalltheImages = async (req, res) => {
  try {
    const images = await prisma.image.findMany({ where: { uploadedBy: req.userInfo.userId }, include: { user: { select: { id: true, username: true, profileImage: true } } }, orderBy: { createdAt: 'desc' } });
    const data = images.map(({ user, ...image }) => ({ ...image, _id: image.id, uploadedBy: user ? { ...user, _id: user.id } : null }));
    return res.json({ success: true, ...(data.length ? {} : { message: 'No media found for this user' }), data });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error while fetching media' }); }
};

const fetchAllOtherImages = async (req, res) => {
  try {
    const images = await prisma.image.findMany({ where: { uploadedBy: { not: req.userInfo.userId } }, include: { user: { include: { images: { orderBy: { createdAt: 'desc' }, take: 1, select: { url: true } } } } }, orderBy: { createdAt: 'desc' } });
    const data = images.filter(({ user }) => user).map(({ user, url, type }) => ({ userId: user.id, postUrl: url, username: user.username, profileImage: !user.profileImage || user.profileImage === 'default.png' ? user.images[0]?.url || 'default.png' : user.profileImage, type: type || 'image' }));
    res.json({ success: true, ...(data.length ? {} : { message: "No other users' media found" }), data });
  } catch (e) { console.error(e); res.status(500).json({ success: false, message: 'Server error while fetching other users media' }); }
};

const deleteImageController = async (req, res) => {
  try {
    const img = await prisma.image.findUnique({ where: { id: req.params.id } });
    if (!img) return res.status(404).json({ success: false, message: 'Image not found' });
    if (img.uploadedBy !== req.userInfo.userId) return res.status(403).json({ success: false, message: 'You are not allowed to delete this image' });
    if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    await prisma.image.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (e) { console.error('DELETE IMAGE ERROR:', e); res.status(500).json({ success: false, message: 'Server error. Try again.' }); }
};
module.exports = { uploadProfileImageController, fetchalltheImages, fetchAllOtherImages, deleteImageController };
