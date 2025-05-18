import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { AuditLogsUpgradePage } from "../../Upgrade/AuditLogsUpgradePage";
import store from "store";
import { getIsAiAgentInstanceEnabled } from "ee/selectors/aiAgentSelectors";

const isAIAgentInstanceEnabled = getIsAiAgentInstanceEnabled(store.getState());

export const config: AdminConfigType = {
  icon: "file-list-2-line",
  type: SettingCategories.AUDIT_LOGS,
  categoryType: CategoryType.ORGANIZATION,
  controlType: SettingTypes.PAGE,
  component: AuditLogsUpgradePage,
  title: "Audit logs",
  canSave: false,
  isFeatureEnabled: false,
  isEnterprise: isAIAgentInstanceEnabled ? true : false,
} as AdminConfigType;
