import {
  AdminConfigType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
export const config: AdminConfigType = {
  type: SettingCategories.ADVANCED,
  controlType: SettingTypes.GROUP,
  title: "Advanced",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_MONGODB_URI",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "MongoDB URI",
      subText:
        "Appsmith internally uses MongoDB. Change to an external MongoDb for Clustering",
    },
    {
      id: "APPSMITH_REDIS_URL",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Redis URL",
      subText:
        "Appsmith internally uses redis for session storage. Change this to an external redis for Clustering",
    },
    {
      id: "APPSMITH_CUSTOM_DOMAIN",
      category: SettingCategories.ADVANCED,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Custom Domain",
      subText: "Custom domain for your Appsmith instance",
    },
  ],
};
