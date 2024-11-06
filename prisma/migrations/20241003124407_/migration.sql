/*
  Warnings:

  - You are about to drop the column `identitystatus` on the `user` table. All the data in the column will be lost.
  - Changed the type of `startTime` on the `shift` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `shift` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "shift" DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIMESTAMPTZ NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIMESTAMPTZ NOT NULL;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "identitystatus",
ADD COLUMN     "isLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visaExpiry" TEXT,
ADD COLUMN     "visaStatus" TEXT;
