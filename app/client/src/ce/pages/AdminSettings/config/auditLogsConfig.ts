import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { AuditLogsUpgradePage } from "../../Upgrade/AuditLogsUpgradePage";

export const config: AdminConfigType = {
  icon: "file-list-2-line",
  type: SettingCategories.AUDIT_LOGS,
  categoryType: "other",
  controlType: SettingTypes.PAGE,
  component: AuditLogsUpgradePage,
  title: "Audit logs",
  canSave: false,
  needsUpgrade: true,
} as AdminConfigType;
