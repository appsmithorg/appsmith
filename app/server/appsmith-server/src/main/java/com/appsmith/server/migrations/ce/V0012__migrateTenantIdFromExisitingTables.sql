-- Update User table
UPDATE "User"
SET "organizationId" = "tenantId"
WHERE "tenantId" IS NOT NULL
	AND "organizationId" IS NULL;

-- Update Workspace table
UPDATE "Workspace"
SET "organizationId" = "tenantId"
WHERE "tenantId" IS NOT NULL
	AND "organizationId" IS NULL;

-- Update PermissionGroup table
UPDATE "PermissionGroup"
SET "organizationId" = "tenantId"
WHERE "tenantId" IS NOT NULL
	AND "organizationId" IS NULL;

-- Update UsagePulse table
UPDATE "UsagePulse"
SET "organizationId" = "tenantId"
WHERE "tenantId" IS NOT NULL
	AND "organizationId" IS NULL;

-- Update UserGroup table
UPDATE "UserGroup"
SET "organizationId" = "tenantId"
WHERE "tenantId" IS NOT NULL
	AND "organizationId" IS NULL;
