-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyFeeException" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playerId" TEXT NOT NULL,
    "amount" REAL,
    "isExempt" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyFeeException_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyFeeException" ("amount", "createdAt", "id", "isExempt", "playerId", "updatedAt") SELECT "amount", "createdAt", "id", "isExempt", "playerId", "updatedAt" FROM "MonthlyFeeException";
DROP TABLE "MonthlyFeeException";
ALTER TABLE "new_MonthlyFeeException" RENAME TO "MonthlyFeeException";
CREATE UNIQUE INDEX "MonthlyFeeException_playerId_key" ON "MonthlyFeeException"("playerId");
CREATE TABLE "new_Player" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "photoUrl" TEXT,
    "birthDate" DATETIME,
    "joinDate" DATETIME,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("birthDate", "createdAt", "id", "joinDate", "name", "number", "photoUrl", "position", "status", "teamId", "updatedAt") SELECT "birthDate", "createdAt", "id", "joinDate", "name", "number", "photoUrl", "position", "status", "teamId", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
CREATE UNIQUE INDEX "Player_teamId_number_key" ON "Player"("teamId", "number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
