import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";
import { Profile } from "../Profile";

export const config: AdminConfigType = {
  icon: "account-circle-line",
  type: SettingCategories.PROFILE,
  categoryType: CategoryType.PROFILE,
  controlType: SettingTypes.PAGE,
  component: Profile,
  title: "Account",
  canSave: false,
} as AdminConfigType;
