/*
  Warnings:

  - The values [UNPAID] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `readings` on the `ServiceReading` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `ServiceReading` table. All the data in the column will be lost.
  - You are about to drop the column `totalAmount` on the `ServiceReading` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[accessCode]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contractId,month]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[contractId,serviceId,month]` on the table `ServiceReading` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - The required column `accessCode` was added to the `Invoice` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `lineItems` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roomCharge` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceCharge` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contractId` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `newIndex` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `oldIndex` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceId` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCost` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPrice` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.
  - Added the required column `usage` to the `ServiceReading` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReadingSource" AS ENUM ('ADMIN', 'TENANT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('PER_ROOM', 'PER_PERSON', 'PER_USAGE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('ALL', 'MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'INVOICE_PAYMENT', 'EXPENSE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TENANT');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');
ALTER TABLE "public"."Invoice" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Invoice" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "Invoice" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "initialIndexes" JSONB,
ADD COLUMN     "numTenants" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "paidDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "paymentDay" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
DROP COLUMN "details",
ADD COLUMN     "accessCode" TEXT NOT NULL,
ADD COLUMN     "debtAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "extraCharge" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lineItems" JSONB NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentHistory" JSONB,
ADD COLUMN     "previousDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "roomCharge" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "serviceCharge" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "month" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "images" JSONB,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "depositPrice" DOUBLE PRECISION,
ADD COLUMN     "floor" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "calculationType" "CalculationType" NOT NULL DEFAULT 'PER_ROOM',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ServiceReading" DROP COLUMN "readings",
DROP COLUMN "roomId",
DROP COLUMN "totalAmount",
ADD COLUMN     "contractId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrls" JSONB,
ADD COLUMN     "isBilled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isConfirmed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isMeterReset" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newIndex" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "oldIndex" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "readingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "serviceId" INTEGER NOT NULL,
ADD COLUMN     "totalCost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "type" "ReadingSource" NOT NULL DEFAULT 'ADMIN',
ADD COLUMN     "unitPrice" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usage" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "month" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "userId" INTEGER;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "contractId" INTEGER,
    "invoiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "image" TEXT,
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestRequest" (
    "id" SERIAL NOT NULL,
    "guestName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "tenantId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetToken" TEXT,
    "resetTokenExp" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "tenantId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_code_key" ON "Transaction"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_accessCode_key" ON "Invoice"("accessCode");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_contractId_month_key" ON "Invoice"("contractId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReading_contractId_serviceId_month_key" ON "ServiceReading"("contractId", "serviceId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_userId_key" ON "Tenant"("userId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReading" ADD CONSTRAINT "ServiceReading_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReading" ADD CONSTRAINT "ServiceReading_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestRequest" ADD CONSTRAINT "GuestRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
