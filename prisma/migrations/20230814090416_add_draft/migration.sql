-- CreateTable
CREATE TABLE `draft` (
    `draftid` VARCHAR(191) NOT NULL,
    `draft` LONGTEXT NOT NULL,

    PRIMARY KEY (`draftid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
