-- CreateTable
CREATE TABLE "PostVector" (
    "id" SERIAL NOT NULL,
    "postId" INTEGER NOT NULL,
    "vector" DOUBLE PRECISION[],

    CONSTRAINT "PostVector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostVector_postId_key" ON "PostVector"("postId");

-- AddForeignKey
ALTER TABLE "PostVector" ADD CONSTRAINT "PostVector_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("postId") ON DELETE RESTRICT ON UPDATE CASCADE;
