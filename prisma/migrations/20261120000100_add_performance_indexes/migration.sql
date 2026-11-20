-- DropIndex
DROP INDEX "DiscoveryResult_studentId_idx";

-- DropIndex
DROP INDEX "CourseProgress_studentId_idx";

-- DropIndex
DROP INDEX "PortfolioProject_studentId_idx";

-- DropIndex
DROP INDEX "PortfolioShareLink_studentId_idx";

-- CreateIndex
CREATE INDEX "User_institutionId_idx" ON "User"("institutionId");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "DiscoveryResult_studentId_completedAt_idx" ON "DiscoveryResult"("studentId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "Track_published_macroAreaId_idx" ON "Track"("published", "macroAreaId");

-- CreateIndex
CREATE INDEX "CourseProgress_studentId_status_idx" ON "CourseProgress"("studentId", "status");

-- CreateIndex
CREATE INDEX "Challenge_published_macroAreaId_idx" ON "Challenge"("published", "macroAreaId");

-- CreateIndex
CREATE INDEX "PortfolioProject_studentId_createdAt_idx" ON "PortfolioProject"("studentId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PortfolioProject_studentId_isIncludedInShare_idx" ON "PortfolioProject"("studentId", "isIncludedInShare");

-- CreateIndex
CREATE INDEX "PortfolioProject_challengeId_studentId_idx" ON "PortfolioProject"("challengeId", "studentId");

-- CreateIndex
CREATE INDEX "PortfolioShareLink_studentId_active_idx" ON "PortfolioShareLink"("studentId", "active");

