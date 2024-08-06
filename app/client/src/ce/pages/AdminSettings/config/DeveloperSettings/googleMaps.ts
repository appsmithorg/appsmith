import { GOOGLE_MAPS_SETUP_DOC } from "constants/ThirdPartyConstants";
import type { Setting } from "../types";
import {
  SettingCategories,
  SettingSubtype,
  SettingTypes,
} from "ee/pages/AdminSettings/config/types";

export const googleMapsConfig: Setting[] = [
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
];
