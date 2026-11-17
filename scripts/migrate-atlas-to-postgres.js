require('dotenv').config();
const mongoose = require('mongoose');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const toId = (value) => value == null ? null : String(value);
const dateOrNow = (value) => value ? new Date(value) : new Date();

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required for the one-time import');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    const [allUsers, posts, images] = await Promise.all([
      db.collection('users').find().toArray(),
      db.collection('posts').find().toArray(),
      db.collection('images').find().toArray(),
    ]);
    const users = allUsers.filter((u) => u.username && u.email && u.password);
    const incompleteUsers = allUsers.filter((u) => !u.username || !u.email || !u.password);
    const userIds = new Set(users.map((u) => toId(u._id)));
    const orphanPosts = posts.filter((p) => !userIds.has(toId(p.uploadedBy)));
    const duplicateCount = (field) => users.length - new Set(users.map((u) => String(u[field]).trim().toLowerCase())).size;
    if (duplicateCount('username') || duplicateCount('email')) {
      throw new Error(`Atlas has duplicate values for unique user fields (username duplicates: ${duplicateCount('username')}, email duplicates: ${duplicateCount('email')}). Resolve these before importing.`);
    }
    await prisma.$transaction(async (tx) => {
      for (const u of users) await tx.user.upsert({ where: { id: toId(u._id) }, create: {
        id: toId(u._id), username: u.username, email: u.email, password: u.password,
        profileImage: u.profileImage || 'default.png', createdAt: dateOrNow(u.createdAt), updatedAt: dateOrNow(u.updatedAt),
      }, update: {
        username: u.username, email: u.email, password: u.password,
        profileImage: u.profileImage || 'default.png', updatedAt: dateOrNow(u.updatedAt),
      } });
      for (const p of posts) await tx.post.upsert({ where: { id: toId(p._id) }, create: {
        id: toId(p._id), mediaUrl: p.mediaUrl, publicId: p.publicId || null, mediaType: p.mediaType || 'image',
        caption: p.caption || '', uploadedBy: userIds.has(toId(p.uploadedBy)) ? toId(p.uploadedBy) : null, createdAt: dateOrNow(p.createdAt), updatedAt: dateOrNow(p.updatedAt),
      }, update: {
        mediaUrl: p.mediaUrl, publicId: p.publicId || null, mediaType: p.mediaType || 'image', caption: p.caption || '',
        uploadedBy: userIds.has(toId(p.uploadedBy)) ? toId(p.uploadedBy) : null, updatedAt: dateOrNow(p.updatedAt),
      } });
      for (const i of images) await tx.image.upsert({ where: { id: toId(i._id) }, create: {
        id: toId(i._id), url: i.url, type: i.type || 'image', publicId: i.publicId,
        usage: i.usage || 'post', uploadedBy: userIds.has(toId(i.uploadedBy)) ? toId(i.uploadedBy) : null, createdAt: dateOrNow(i.createdAt), updatedAt: dateOrNow(i.updatedAt),
      }, update: {
        url: i.url, type: i.type || 'image', publicId: i.publicId, usage: i.usage || 'post',
        uploadedBy: userIds.has(toId(i.uploadedBy)) ? toId(i.uploadedBy) : null, updatedAt: dateOrNow(i.updatedAt),
      } });
    }, { timeout: 120000 });
    console.log(`Imported ${users.length} users, ${posts.length} posts, and ${images.length} images. Skipped ${incompleteUsers.length} incomplete user record(s); ${orphanPosts.length} post(s) have no matching author and were kept with a null author.`);
  } finally { await mongoose.disconnect(); await prisma.$disconnect(); }
}

run().catch((error) => { console.error('Atlas import failed:', error.message); process.exitCode = 1; });
