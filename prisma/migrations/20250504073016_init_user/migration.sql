-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nickname" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "birthYear" INTEGER NOT NULL,
    "language" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "difficulties" TEXT,
    "emContactName" TEXT NOT NULL,
    "emContactNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'safe',
    "safetyStage" INTEGER NOT NULL DEFAULT 1,
    "lastCheckinTime" TIMESTAMP(3),
    "lastLatitude" DOUBLE PRECISION,
    "lastLongitude" DOUBLE PRECISION,
    "lastUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");
