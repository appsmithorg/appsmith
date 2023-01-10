import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { Billing } from "@appsmith/pages/Billing";

export const config: AdminConfigType = {
  icon: "file-list-2-line",
  type: SettingCategories.BILLING,
  controlType: SettingTypes.PAGE,
  component: Billing,
  title: "Billing",
  canSave: false,
} as AdminConfigType;
