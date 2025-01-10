/*
  Warnings:

  - You are about to drop the column `capacity` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "capacity",
ADD COLUMN     "ticketPrice" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "ticketQuantity" INTEGER NOT NULL DEFAULT 0;
