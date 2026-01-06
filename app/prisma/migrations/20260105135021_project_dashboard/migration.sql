-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectDashboardEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "ProjectDashboardEntry_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "ProjectDashboardEntry_projectId_idx" ON "ProjectDashboardEntry"("projectId");
CREATE INDEX IF NOT EXISTS "ProjectDashboardEntry_authorId_idx" ON "ProjectDashboardEntry"("authorId");

-- Foreign keys
ALTER TABLE "ProjectDashboardEntry" ADD CONSTRAINT "ProjectDashboardEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDashboardEntry" ADD CONSTRAINT "ProjectDashboardEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
