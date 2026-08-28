-- CreateTable
CREATE TABLE "RatgeberPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "excerptEn" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL DEFAULT '',
    "coverImage" TEXT NOT NULL DEFAULT '',
    "coverImageAlt" TEXT NOT NULL DEFAULT '',
    "coverImageAltEn" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatgeberPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RatgeberPost_slug_key" ON "RatgeberPost"("slug");

-- CreateIndex
CREATE INDEX "RatgeberPost_published_publishedAt_idx" ON "RatgeberPost"("published", "publishedAt");
