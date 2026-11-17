# PostgreSQL migration status

The app now uses Prisma with PostgreSQL on Neon. The one-time Atlas import completed with 21 users, 10 posts, and 28 images. One incomplete user record was skipped, and three posts with no matching Atlas user were imported with a null author. The one-time importer has been removed after the successful import.

## Environment

Set `DATABASE_URL` to the pooled Neon URL and `DIRECT_URL` to the direct Neon URL in local `.env` and in the deployed backend's environment settings. Keep these credentials private; do not commit `.env`. Cloudinary and JWT settings are still required by the app.

## Future schema changes

Edit `prisma/schema.prisma`, then create a migration during development:

```powershell
npm run db:migrate:dev -- --name describe_change
```

Commit the generated migration folder. Apply committed migrations in the deployment environment with:

```powershell
npm run db:migrate:deploy
```

Regenerate Prisma Client after schema edits with:

```powershell
npm run db:generate
```
