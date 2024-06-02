/*
  Warnings:

  - A unique constraint covering the columns `[routePath]` on the table `RouteAnalytics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "RouteAnalytics_routePath_key" ON "RouteAnalytics"("routePath");
