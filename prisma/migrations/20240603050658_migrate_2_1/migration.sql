-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" TEXT,
ADD COLUMN     "authenticated" BOOLEAN NOT NULL DEFAULT false;
