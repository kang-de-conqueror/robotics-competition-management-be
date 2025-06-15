/*
  Warnings:

  - The values [COMMON] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `teamMembers` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `DateOfBirth` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - Added the required column `leaderId` to the `Team` table without a default value. This is not possible if the table is not empty.
  - Made the column `tournamentId` on table `Team` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'HEAD_REFEREE', 'ALLIANCE_REFEREE', 'USER');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Team" DROP CONSTRAINT "Team_tournamentId_fkey";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Team" DROP COLUMN "teamMembers",
ADD COLUMN     "leaderId" TEXT NOT NULL,
ADD COLUMN     "province" TEXT,
ADD COLUMN     "status" "TeamStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "teamNumber" DROP NOT NULL,
ALTER COLUMN "tournamentId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "maxTeamMembers" INTEGER,
ADD COLUMN     "maxTeams" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "DateOfBirth",
DROP COLUMN "username",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'INACTIVE',
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'USER',
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "_TeamMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeamMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
