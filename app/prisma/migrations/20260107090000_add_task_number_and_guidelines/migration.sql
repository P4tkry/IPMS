-- AlterEnum
BEGIN;
CREATE TYPE "ProjectPermission_new" AS ENUM ('USERS_MANAGE', 'DASHBOARD_MANAGE', 'DASHBOARD_POST', 'TASK_VIEW', 'TASKS_CUD', 'PROJECT_REMOVE', 'PROJECT_EDIT');
ALTER TABLE "public"."ProjectMember" ALTER COLUMN "permissions" DROP DEFAULT;
ALTER TABLE "ProjectMember" ALTER COLUMN "permissions" TYPE "ProjectPermission_new"[] USING ("permissions"::text::"ProjectPermission_new"[]);
ALTER TYPE "ProjectPermission" RENAME TO "ProjectPermission_old";
ALTER TYPE "ProjectPermission_new" RENAME TO "ProjectPermission";
DROP TYPE "public"."ProjectPermission_old";
ALTER TABLE "ProjectMember" ALTER COLUMN "permissions" SET DEFAULT ARRAY[]::"ProjectPermission"[];
COMMIT;

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_categoryId_fkey";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deliveryGuidelines" TEXT,
ADD COLUMN     "taskNumber" INTEGER NOT NULL,
ALTER COLUMN "categoryId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Task_categoryId_taskNumber_key" ON "Task"("categoryId", "taskNumber");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TaskCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

