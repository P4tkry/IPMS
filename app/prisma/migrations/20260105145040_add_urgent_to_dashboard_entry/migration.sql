-- Add urgent flag to project dashboard entries
ALTER TABLE "ProjectDashboardEntry"
ADD COLUMN "urgent" BOOLEAN NOT NULL DEFAULT false;
