export * from "ce/pages/AdminSettings/config/auditLogsConfig";
import { config as CE_config } from "ce/pages/AdminSettings/config/auditLogsConfig";
import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import AuditLogsFeatureContainer from "@appsmith/pages/AuditLogs";

export const config: AdminConfigType = {
  ...CE_config,
  component: AuditLogsFeatureContainer,
  title: "Audit logs",
  needsUpgrade: false,
} as AdminConfigType;
