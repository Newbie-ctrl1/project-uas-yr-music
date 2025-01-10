-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "isSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sentAt" TIMESTAMP(3);
