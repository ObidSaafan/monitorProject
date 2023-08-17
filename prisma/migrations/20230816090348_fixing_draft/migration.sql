/*
  Warnings:

  - You are about to alter the column `draft` on the `draft` table. The data in that column could be lost. The data in that column will be cast from `LongText` to `Json`.
  - A unique constraint covering the columns `[email]` on the table `clientpm` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `draft` MODIFY `draft` JSON NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `clientpm_email_key` ON `clientpm`(`email`);
