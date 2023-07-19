import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { hasBrandingEnabled } from "@appsmith/utils/planHelpers";
import BrandingPage from "pages/Settings/config/branding/BrandingPage";

export const config: AdminConfigType = {
  type: SettingCategories.BRANDING,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.PAGE,
  canSave: false,
  title: "Branding",
  icon: "pantone",
  component: BrandingPage,
  needsUpgrade: hasBrandingEnabled(),
};
