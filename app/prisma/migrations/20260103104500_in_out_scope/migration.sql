-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "inScope" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "outScope" TEXT[] DEFAULT ARRAY[]::TEXT[];
