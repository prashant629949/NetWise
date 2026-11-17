const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const connectDB = async () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is missing from .env');
  await prisma.$connect();
  console.log('PostgreSQL connected successfully through Prisma');
};

module.exports = { prisma, connectDB };
