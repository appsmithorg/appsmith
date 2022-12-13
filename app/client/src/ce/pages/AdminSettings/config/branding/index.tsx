import {
  AdminConfigType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import BrandingPage from "pages/Settings/config/branding/BrandingPage";

export const config: AdminConfigType = {
  type: SettingCategories.BRANDING,
  controlType: SettingTypes.PAGE,
  canSave: false,
  title: "Branding",
  icon: "pantone",
  component: BrandingPage,
};
