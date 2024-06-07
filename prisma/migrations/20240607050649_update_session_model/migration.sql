/*
  Warnings:

  - A unique constraint covering the columns `[sessionData]` on the table `Session` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionData_key" ON "Session"("sessionData");
