/*
  Warnings:

  - Added the required column `organization_id` to the `assets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organization_id` to the `work_orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "assets" ADD COLUMN     "organization_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "organization_id" UUID,
ADD COLUMN     "password_hash" TEXT NOT NULL;

-- -- AlterTable
-- ALTER TABLE "work_orders" ADD COLUMN     "organization_id" UUID NOT NULL;

-- CreateTable
-- CREATE TABLE "organizations" (
--     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--     "name" VARCHAR(100) NOT NULL,
--     "domain" VARCHAR(100) NOT NULL,
--     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

--     CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
-- );

-- -- CreateIndex
-- CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- -- CreateIndex
-- CREATE UNIQUE INDEX "organizations_domain_key" ON "organizations"("domain");

-- -- AddForeignKey
-- ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "assets" ADD CONSTRAINT "assets_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
