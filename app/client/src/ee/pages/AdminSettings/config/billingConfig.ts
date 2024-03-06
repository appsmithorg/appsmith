import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { Billing } from "@appsmith/pages/Billing";
import {
  ADMIN_BILLING_SETTINGS_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

export const config: AdminConfigType = {
  icon: "key-2-line",
  type: SettingCategories.BILLING,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.PAGE,
  component: Billing,
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
  canSave: false,
} as AdminConfigType;
