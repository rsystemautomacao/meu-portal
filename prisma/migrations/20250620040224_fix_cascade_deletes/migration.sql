-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MatchSheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shareToken" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startTime" DATETIME,
    "endTime" DATETIME,
    "firstHalfEnd" DATETIME,
    "secondHalfStart" DATETIME,
    "matchId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchSheet_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MatchSheet" ("createdAt", "endTime", "firstHalfEnd", "id", "matchId", "secondHalfStart", "shareToken", "startTime", "status", "updatedAt") SELECT "createdAt", "endTime", "firstHalfEnd", "id", "matchId", "secondHalfStart", "shareToken", "startTime", "status", "updatedAt" FROM "MatchSheet";
DROP TABLE "MatchSheet";
ALTER TABLE "new_MatchSheet" RENAME TO "MatchSheet";
CREATE UNIQUE INDEX "MatchSheet_shareToken_key" ON "MatchSheet"("shareToken");
CREATE UNIQUE INDEX "MatchSheet_matchId_key" ON "MatchSheet"("matchId");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "paymentDate" DATETIME,
    "status" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "createdAt", "dueDate", "id", "month", "paymentDate", "playerId", "status", "updatedAt", "year") SELECT "amount", "createdAt", "dueDate", "id", "month", "paymentDate", "playerId", "status", "updatedAt", "year" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_playerId_idx" ON "Payment"("playerId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_month_year_idx" ON "Payment"("month", "year");
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "incomeType" TEXT,
    "expenseType" TEXT,
    "description" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "createdAt", "date", "description", "expenseType", "id", "incomeType", "teamId", "type", "updatedAt") SELECT "amount", "createdAt", "date", "description", "expenseType", "id", "incomeType", "teamId", "type", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_teamId_idx" ON "Transaction"("teamId");
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
