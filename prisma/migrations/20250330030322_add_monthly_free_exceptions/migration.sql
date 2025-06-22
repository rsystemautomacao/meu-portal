-- CreateTable
CREATE TABLE "MonthlyFeeException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyFeeException_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonthlyFeeException_playerId_idx" ON "MonthlyFeeException"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyFeeException_playerId_key" ON "MonthlyFeeException"("playerId");
