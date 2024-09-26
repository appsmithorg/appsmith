import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";

export const config: AdminConfigType = {
  icon: "settings-line",
  type: SettingCategories.ADVANCED,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "Advanced",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_DB_URL",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Appsmith DB URL",
      subText:
        "* Persistence database URL for Appsmith instance. Change this to an external database for clustering",
    },
    {
      id: "APPSMITH_REDIS_URL",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Redis URL",
      subText:
        "* Appsmith internally uses Redis for session storage. Change this to an external redis for clustering",
    },
    {
      id: "APPSMITH_CUSTOM_DOMAIN",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Custom domain",
      subText: "* Custom domain for your Appsmith instance",
    },
  ],
};
