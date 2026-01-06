-- AlterTable
ALTER TABLE "Task"
ADD COLUMN "completionDescription" TEXT,
ADD COLUMN "completionLinks" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "completionFiles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
