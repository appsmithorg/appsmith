import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { GOOGLE_MAPS_SETUP_DOC } from "constants/ThirdPartyConstants";

export const config: AdminConfigType = {
  icon: "snippet",
  type: SettingCategories.DEVELOPER_SETTINGS,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.GROUP,
  title: "Developer Settings",
  canSave: true,
  settings: [
    {
      id: "APPSMITH_GOOGLE_MAPS_READ_MORE",
      category: SettingCategories.DEVELOPER_SETTINGS,
      controlType: SettingTypes.CALLOUT,
      label: "How to configure google maps?",
      url: GOOGLE_MAPS_SETUP_DOC,
    },
    {
      id: "googleMapsKey",
      category: SettingCategories.DEVELOPER_SETTINGS,
      controlType: SettingTypes.TEXTINPUT,
      controlSubType: SettingSubtype.TEXT,
      label: "Google Maps API key",
    },
  ],
};
