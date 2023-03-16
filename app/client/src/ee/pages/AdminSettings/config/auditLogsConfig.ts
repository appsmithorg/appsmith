import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import AuditLogsFeatureContainer from "@appsmith/pages/AuditLogs";

export const config: AdminConfigType = {
  icon: "file-list-2-line",
  type: SettingCategories.AUDIT_LOGS,
  controlType: SettingTypes.PAGE,
  component: AuditLogsFeatureContainer,
  title: "Audit logs",
  canSave: false,
} as AdminConfigType;
