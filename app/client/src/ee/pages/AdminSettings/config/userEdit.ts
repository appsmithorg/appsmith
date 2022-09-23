import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { UserEdit } from "../acl/UserEdit";

export const config: AdminConfigType = {
  type: SettingCategories.USER_LISTING,
  controlType: SettingTypes.PAGE,
  component: UserEdit,
  title: "Users",
  canSave: false,
} as AdminConfigType;
