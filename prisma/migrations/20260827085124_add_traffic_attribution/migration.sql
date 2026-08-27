-- AlterTable
ALTER TABLE "CheckoutRecovery" ADD COLUMN     "trafficChannel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trafficSource" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "trafficChannel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "trafficSource" TEXT NOT NULL DEFAULT '';
