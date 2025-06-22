-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MonthlyFeeConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "MonthlyFeeConfig_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MonthlyFeeConfig" ("amount", "createdAt", "dueDay", "id", "isActive", "teamId", "updatedAt") SELECT "amount", "createdAt", "dueDay", "id", "isActive", "teamId", "updatedAt" FROM "MonthlyFeeConfig";
DROP TABLE "MonthlyFeeConfig";
ALTER TABLE "new_MonthlyFeeConfig" RENAME TO "MonthlyFeeConfig";
CREATE UNIQUE INDEX "MonthlyFeeConfig_teamId_key" ON "MonthlyFeeConfig"("teamId");
CREATE TABLE "new_TeamUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamUser_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TeamUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TeamUser" ("createdAt", "id", "role", "teamId", "updatedAt", "userId") SELECT "createdAt", "id", "role", "teamId", "updatedAt", "userId" FROM "TeamUser";
DROP TABLE "TeamUser";
ALTER TABLE "new_TeamUser" RENAME TO "TeamUser";
CREATE UNIQUE INDEX "TeamUser_teamId_userId_key" ON "TeamUser"("teamId", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
