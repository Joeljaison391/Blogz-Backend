-- AlterTable
ALTER TABLE "User" ADD COLUMN     "about" TEXT,
ADD COLUMN     "availableFor" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "brandColor" TEXT,
ADD COLUMN     "currentlyHacking" TEXT,
ADD COLUMN     "currentlyLearning" TEXT,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "joinedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "personalWebsite" TEXT,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workPronoun" TEXT,
ALTER COLUMN "role" SET DEFAULT 'user';
