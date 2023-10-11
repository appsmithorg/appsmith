import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { googleMapsConfig } from "./googleMaps";

export const config: AdminConfigType = {
  icon: "snippet",
  type: SettingCategories.DEVELOPER_SETTINGS,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "Developer settings",
  canSave: true,
  settings: [...googleMapsConfig],
};
