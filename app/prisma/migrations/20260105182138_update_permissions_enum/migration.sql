/*
  Warnings:

  - The `permissions` column on the `ProjectMember` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Permission" ADD VALUE 'USERS_MANAGE';
ALTER TYPE "Permission" ADD VALUE 'DASHBOARD_MANAGE';
ALTER TYPE "Permission" ADD VALUE 'DASHBOARD_POST';

-- AlterTable
ALTER TABLE "ProjectMember" DROP COLUMN "permissions",
ADD COLUMN     "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[];
