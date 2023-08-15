-- CreateTable
CREATE TABLE `actualspend` (
    `idas` VARCHAR(191) NOT NULL,
    `source` VARCHAR(55) NOT NULL,
    `value` DOUBLE NOT NULL,
    `date` DATE NOT NULL,
    `idproject` VARCHAR(55) NOT NULL,

    INDEX `fk_actualspend_project`(`idproject`),
    PRIMARY KEY (`idas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budgetedcost` (
    `idbc` VARCHAR(191) NOT NULL,
    `source` VARCHAR(55) NOT NULL,
    `value` DOUBLE NOT NULL,
    `idproject` VARCHAR(55) NOT NULL,

    INDEX `fk_budgetedcost_project`(`idproject`),
    PRIMARY KEY (`idbc`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client` (
    `clientid` VARCHAR(191) NOT NULL,
    `clientname` VARCHAR(45) NOT NULL,

    UNIQUE INDEX `client_clientname_key`(`clientname`),
    PRIMARY KEY (`clientid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientpm` (
    `clientpmid` VARCHAR(191) NOT NULL,
    `email` VARCHAR(55) NOT NULL,
    `name` VARCHAR(45) NULL,
    `clientid` VARCHAR(191) NOT NULL,

    INDEX `clientID_idx`(`clientid`),
    PRIMARY KEY (`clientpmid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice` (
    `invoiceid` VARCHAR(191) NOT NULL,
    `source` VARCHAR(55) NOT NULL,
    `value` DOUBLE NOT NULL,
    `status` VARCHAR(45) NOT NULL,
    `date_of_submission` DATE NOT NULL,
    `date_of_receiving` DATE NULL,
    `idproject` VARCHAR(55) NOT NULL,

    INDEX `fk_invoice_project`(`idproject`),
    PRIMARY KEY (`invoiceid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `paymentmilestone` (
    `idpm` VARCHAR(191) NOT NULL,
    `milestonetext` MEDIUMTEXT NOT NULL,
    `milestonevalue` DOUBLE NOT NULL,
    `idproject` VARCHAR(55) NOT NULL,

    INDEX `fk_paymentmilestone_project`(`idproject`),
    PRIMARY KEY (`idpm`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `idp` VARCHAR(191) NOT NULL,
    `idproject` VARCHAR(55) NOT NULL,
    `projectname` VARCHAR(45) NOT NULL,
    `description` MEDIUMTEXT NULL,
    `projecttype` ENUM('fixedPrice', 'TnM', 'SnM', 'OPEX') NOT NULL,
    `projectstatus` ENUM('notStarted', 'inProgress', 'onHold', 'cancelled', 'finished') NOT NULL,
    `projectstartdate` DATE NOT NULL,
    `projectmanager` VARCHAR(191) NOT NULL,
    `clientpmid` VARCHAR(191) NOT NULL,
    `durationOfproject` INTEGER NULL,
    `plannedcompletiondate` DATE NULL,
    `currency` ENUM('AED', 'USD', 'EUR', 'AUD') NOT NULL,
    `contractvalue` DOUBLE NOT NULL,
    `contractstatus` ENUM('Signed', 'Notsigned', 'LOA') NOT NULL,
    `referencenumber` VARCHAR(45) NOT NULL,
    `expectedprofit` DOUBLE NOT NULL,
    `actualprofit` DOUBLE NULL,
    `clientid` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `project_idproject_key`(`idproject`),
    INDEX `fk_project_client`(`clientid`),
    INDEX `projectManager_idx`(`projectmanager`),
    INDEX `CprojectManager_idx`(`clientpmid`),
    PRIMARY KEY (`idp`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `revenuerecognized` (
    `idrr` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `value` DOUBLE NOT NULL,
    `idproject` VARCHAR(55) NOT NULL,

    INDEX `fk_revenuerecognized_project`(`idproject`),
    PRIMARY KEY (`idrr`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role` (
    `idrole` VARCHAR(191) NOT NULL,
    `rolename` VARCHAR(45) NOT NULL,
    `permissions` MEDIUMTEXT NOT NULL,

    PRIMARY KEY (`idrole`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `iduser` VARCHAR(191) NOT NULL,
    `email` VARCHAR(80) NOT NULL,
    `password` VARCHAR(80) NOT NULL,
    `firstname` VARCHAR(45) NOT NULL,
    `lastname` VARCHAR(45) NOT NULL,
    `roleid` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `roleID_idx`(`roleid`),
    PRIMARY KEY (`iduser`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `actualspend` ADD CONSTRAINT `fk_actualspend_project` FOREIGN KEY (`idproject`) REFERENCES `project`(`idproject`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `budgetedcost` ADD CONSTRAINT `fk_budgetedcost_project` FOREIGN KEY (`idproject`) REFERENCES `project`(`idproject`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `clientpm` ADD CONSTRAINT `clientID` FOREIGN KEY (`clientid`) REFERENCES `client`(`clientid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `invoice` ADD CONSTRAINT `fk_invoice_project` FOREIGN KEY (`idproject`) REFERENCES `project`(`idproject`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `paymentmilestone` ADD CONSTRAINT `fk_paymentmilestone_project` FOREIGN KEY (`idproject`) REFERENCES `project`(`idproject`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `fk_project_client` FOREIGN KEY (`clientid`) REFERENCES `client`(`clientid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `projectManager` FOREIGN KEY (`projectmanager`) REFERENCES `user`(`iduser`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `CprojectManager_idx` FOREIGN KEY (`clientpmid`) REFERENCES `clientpm`(`clientpmid`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `revenuerecognized` ADD CONSTRAINT `fk_revenuerecognized_project` FOREIGN KEY (`idproject`) REFERENCES `project`(`idproject`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `roleID` FOREIGN KEY (`roleid`) REFERENCES `role`(`idrole`) ON DELETE RESTRICT ON UPDATE RESTRICT;

