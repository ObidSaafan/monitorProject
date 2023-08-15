/*
  Warnings:

  - Added the required column `creator` to the `draft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `draft` ADD COLUMN `creator` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `creator_idx` ON `draft`(`creator`);

-- AddForeignKey
ALTER TABLE `draft` ADD CONSTRAINT `creator` FOREIGN KEY (`creator`) REFERENCES `user`(`iduser`) ON DELETE RESTRICT ON UPDATE RESTRICT;
