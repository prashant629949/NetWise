-- Existing Atlas posts include records whose uploader was removed from users.
ALTER TABLE "posts" ALTER COLUMN "uploaded_by" DROP NOT NULL;
