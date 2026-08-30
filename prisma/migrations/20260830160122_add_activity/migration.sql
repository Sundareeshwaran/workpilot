/*
  Warnings:

  - You are about to drop the column `entityId` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `projectId` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "entityId",
DROP COLUMN "entityType",
ADD COLUMN     "details" JSONB,
ADD COLUMN     "projectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");

-- CreateIndex
CREATE INDEX "Activity_projectId_idx" ON "Activity"("projectId");

-- CreateIndex
CREATE INDEX "Activity_createdAt_idx" ON "Activity"("createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
