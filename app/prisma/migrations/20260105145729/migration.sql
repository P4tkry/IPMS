-- AlterTable
ALTER TABLE "ProjectDashboardEntry" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
