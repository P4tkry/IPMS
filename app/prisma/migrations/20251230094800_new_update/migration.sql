/*
  Warnings:

  - The values [CREATE_PROJECTS] on the enum `Permission` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Permission_new" AS ENUM ('CREATE_USERS', 'REMOVE_USERS', 'UPDATE_USERS', 'CREATE_ALL_PROJECTS', 'REMOVE_ALL_PROJECTS', 'UPDATE_ALL_PROJECTS');
ALTER TABLE "User" ALTER COLUMN "permissions" TYPE "Permission_new"[] USING ("permissions"::text::"Permission_new"[]);
ALTER TYPE "Permission" RENAME TO "Permission_old";
ALTER TYPE "Permission_new" RENAME TO "Permission";
DROP TYPE "public"."Permission_old";
COMMIT;
