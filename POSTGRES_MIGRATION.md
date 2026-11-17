# MongoDB Atlas to Neon PostgreSQL with Prisma

The app uses Prisma ORM with PostgreSQL. Neon hosts the PostgreSQL database so the deployed app can reach it. The Atlas importer reads the existing MongoDB collections and copies them into the Prisma tables.

## Set up Neon

1. Create a project at [neon.com](https://neon.com/) and choose a region close to your app server.
2. Open the project and choose **Connect**. Select the project branch, database, and role.
3. Copy the **pooled** connection string for application traffic. Copy the **direct** connection string too; Prisma uses it for database migrations.
4. Keep both URLs private. They contain database credentials.

## Configure local development

In the project `.env`, set:

```dotenv
DATABASE_URL="the pooled Neon URL"
DIRECT_URL="the direct Neon URL"
MONGO_URI="your existing MongoDB Atlas URL"
JWT_SECRET_KEY="your existing JWT secret"
```

Keep the existing Cloudinary variables. In the Neon strings, preserve query parameters such as `sslmode=require`. If the database password contains reserved URL characters, use the URL Neon provides or percent-encode those characters.

Add `DATABASE_URL`, `DIRECT_URL`, and the existing app secrets to the deployed backend's environment settings as well. `.env` is for local development and should not be committed.

## Create the schema and import Atlas

1. Back up Atlas. Stop the app or otherwise pause writes during the import so new MongoDB changes are not missed.
2. From PowerShell in `C:\Projects\Netwise`, apply the checked-in Prisma migration:

   ```powershell
   npm run db:migrate:deploy
   ```

3. Copy Atlas data into Neon:

   ```powershell
   npm run db:migrate:atlas
   ```

   This copies `users`, `posts`, and `images`, preserving MongoDB IDs and timestamps. It reports the record counts. The importer can be rerun; it upserts by ID. User records missing username, email, or password are skipped. Posts whose uploader no longer exists in Atlas are retained with a null author; images without a valid uploader are retained without an owner.

4. Confirm the counts and spot-check users, posts, and images in Neon. Then deploy/start the updated app.
5. Verify login, search, feed, profile image, and upload/delete flows. Keep Atlas as a backup until the cutover is confirmed.

For future schema edits during development, update `prisma/schema.prisma` and run `npm run db:migrate:dev -- --name describe_change`. Deploy those checked-in migrations with `npm run db:migrate:deploy`.
