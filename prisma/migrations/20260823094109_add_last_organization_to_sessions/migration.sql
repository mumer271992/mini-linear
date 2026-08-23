-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "last_organization_id" TEXT;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_last_organization_id_fkey" FOREIGN KEY ("last_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
