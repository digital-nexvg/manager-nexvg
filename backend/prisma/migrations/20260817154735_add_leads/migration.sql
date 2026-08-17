-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "city" TEXT,
    "segment" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'Formulário',
    "stage" TEXT NOT NULL DEFAULT 'Novo',
    "convertedAt" TIMESTAMP(3),
    "convertedClientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_whatsapp_key" ON "leads"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "leads_convertedClientId_key" ON "leads"("convertedClientId");

-- CreateIndex
CREATE INDEX "leads_origin_idx" ON "leads"("origin");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "leads"("stage");
