/*
  Warnings:

  - Made the column `organization_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "organization_id" SET NOT NULL;
