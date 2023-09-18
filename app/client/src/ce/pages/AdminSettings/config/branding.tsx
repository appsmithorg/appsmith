import type { AdminConfigType } from "@appsmith/pages/AdminSettings/config/types";
import {
  CategoryType,
  SettingCategories,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { selectFeatureFlags } from "@appsmith/selectors/featureFlagsSelectors";
import { isBrandingEnabled } from "@appsmith/utils/planHelpers";
import BrandingPage from "pages/AdminSettings/Branding/BrandingPage";
import store from "store";

const featureFlags = selectFeatureFlags(store.getState());

export const config: AdminConfigType = {
  type: SettingCategories.BRANDING,
  categoryType: CategoryType.GENERAL,
  controlType: SettingTypes.PAGE,
  canSave: false,
  title: "Branding",
  icon: "pantone",
  component: BrandingPage,
  isFeatureEnabled: isBrandingEnabled(featureFlags),
};
