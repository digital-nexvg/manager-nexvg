-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "companyName" TEXT NOT NULL,
    "responsible" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "address" TEXT,
    "observations" TEXT,
    "segment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "customStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "clientId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "month" TEXT,
    "createdMonth" TEXT,
    "paymentDate" TIMESTAMP(3),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_steps" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "clientId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_notes" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journey_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_externalId_key" ON "clients"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_externalId_key" ON "payments"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_steps_externalId_key" ON "journey_steps"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "journey_notes_clientId_key" ON "journey_notes"("clientId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_steps" ADD CONSTRAINT "journey_steps_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journey_notes" ADD CONSTRAINT "journey_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
