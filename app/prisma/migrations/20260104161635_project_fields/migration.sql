-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "chances" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kpis" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "milestones" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mvp" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "terms" JSONB,
ADD COLUMN     "threats" TEXT[] DEFAULT ARRAY[]::TEXT[];
