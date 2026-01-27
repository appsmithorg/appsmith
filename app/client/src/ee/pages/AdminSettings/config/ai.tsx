import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import AISettings from "pages/AdminSettings/AI";

export const config: AdminConfigType = {
  type: SettingCategories.AI,
  categoryType: CategoryType.ORGANIZATION,
  controlType: SettingTypes.PAGE,
  canSave: false,
  title: "AI Assistant",
  icon: "sparkles",
  component: AISettings,
  isFeatureEnabled: true,
};
