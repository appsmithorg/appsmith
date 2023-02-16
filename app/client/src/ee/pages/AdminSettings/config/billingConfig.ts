import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { Billing } from "@appsmith/pages/Billing";
import {
  ADMIN_BILLING_SETTINGS_TITLE,
  createMessage,
} from "@appsmith/constants/messages";

export const config: AdminConfigType = {
  icon: "file-list-2-line",
  type: SettingCategories.BILLING,
  controlType: SettingTypes.PAGE,
  component: Billing,
  title: createMessage(ADMIN_BILLING_SETTINGS_TITLE),
  canSave: false,
} as AdminConfigType;
