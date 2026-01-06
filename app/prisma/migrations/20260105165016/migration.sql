/*
  Warnings:

  - You are about to drop the column `leaderId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_leaderId_fkey";

-- DropIndex
DROP INDEX "Project_leaderId_idx";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "leaderId";
