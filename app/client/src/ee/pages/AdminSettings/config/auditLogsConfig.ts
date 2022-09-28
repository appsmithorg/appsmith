import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import AuditLogsFeatureContainer from "@appsmith/pages/AuditLogs";

export const config: AdminConfigType = {
  type: SettingCategories.AUDIT_LOGS,
  controlType: SettingTypes.PAGE,
  component: AuditLogsFeatureContainer,
  title: "Audit logs",
  canSave: false,
} as AdminConfigType;
