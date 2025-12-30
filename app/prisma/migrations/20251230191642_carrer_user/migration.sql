-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hobbies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "CareerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "duration" TEXT NOT NULL,

    CONSTRAINT "CareerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CareerEntry_userId_idx" ON "CareerEntry"("userId");

-- AddForeignKey
ALTER TABLE "CareerEntry" ADD CONSTRAINT "CareerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
