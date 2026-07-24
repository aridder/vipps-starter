-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'ADMIN', 'OWNER');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('ONE_TIME', 'SUBSCRIPTION', 'DONATION');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'PAID', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "AgreementInterval" AS ENUM ('MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('PENDING', 'ACTIVE', 'STOPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('GENERAL', 'PAYMENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "vippsSub" TEXT,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "image" TEXT,
    "roles" "Role"[] DEFAULT ARRAY['MEMBER']::"Role"[],
    "activeOrgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "vippsMsn" TEXT,
    "vippsWebhookId" TEXT,
    "vippsWebhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "roles" "Role"[] DEFAULT ARRAY['MEMBER']::"Role"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT,
    "agreementId" TEXT,
    "reference" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amountOre" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "vippsState" TEXT,
    "autoCapture" BOOLEAN NOT NULL DEFAULT true,
    "capturedOre" INTEGER NOT NULL DEFAULT 0,
    "refundedOre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "userId" TEXT NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "vippsId" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'PENDING',
    "interval" "AgreementInterval" NOT NULL,
    "amountOre" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "nextChargeDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgreementCharge" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "vippsId" TEXT,
    "reference" TEXT NOT NULL,
    "amountOre" INTEGER NOT NULL,
    "due" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgreementCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_vippsSub_key" ON "User"("vippsSub");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_orgId_key" ON "Membership"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_orgId_idx" ON "Payment"("orgId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_agreementId_idx" ON "Payment"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_vippsId_key" ON "Agreement"("vippsId");

-- CreateIndex
CREATE INDEX "Agreement_orgId_idx" ON "Agreement"("orgId");

-- CreateIndex
CREATE INDEX "Agreement_userId_idx" ON "Agreement"("userId");

-- CreateIndex
CREATE INDEX "Agreement_status_idx" ON "Agreement"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementCharge_reference_key" ON "AgreementCharge"("reference");

-- CreateIndex
CREATE INDEX "AgreementCharge_agreementId_idx" ON "AgreementCharge"("agreementId");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementCharge" ADD CONSTRAINT "AgreementCharge_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

