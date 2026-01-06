-- AlterTable
ALTER TABLE "Task"
ADD COLUMN     "acceptanceCriteria" TEXT,
ADD COLUMN     "userStory" TEXT;

UPDATE "Task" SET "acceptanceCriteria" = "deliveryGuidelines" WHERE "acceptanceCriteria" IS NULL;

ALTER TABLE "Task" DROP COLUMN "deliveryGuidelines";
