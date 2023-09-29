export * from "ce/constants/PackageConstants";
import type { Package as CE_Package } from "ce/constants/PackageConstants";

export type Package = CE_Package;

export type PackageMetadata = Pick<
  Package,
  "id" | "name" | "workspaceId" | "icon" | "color" | "modifiedAt" | "modifiedBy"
>;
