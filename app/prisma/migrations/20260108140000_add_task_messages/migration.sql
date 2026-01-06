-- AlterEnum
ALTER TYPE "ProjectPermission" ADD VALUE 'TASK_MESSAGE_CRUD';

-- CreateTable
CREATE TABLE "TaskMessage" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "TaskMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskMessage_taskId_idx" ON "TaskMessage"("taskId");

-- CreateIndex
CREATE INDEX "TaskMessage_authorId_idx" ON "TaskMessage"("authorId");

-- AddForeignKey
ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
