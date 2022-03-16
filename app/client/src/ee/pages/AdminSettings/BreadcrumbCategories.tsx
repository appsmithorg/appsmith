export * from "ce/pages/AdminSettings/BreadcrumbCategories";
import { BreadcrumbCategories as CE_BreadcrumbCategories } from "ce/pages/AdminSettings/BreadcrumbCategories";
import { SettingCategories } from "./config/types";
import { getAdminSettingsCategoryUrl } from "constants/routes";

const EE_BreadcrumbCategories = {
  [SettingCategories.OIDC_AUTH]: {
    href: getAdminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.OIDC_AUTH,
    ),
    text: "OIDC Authentication",
  },
};

export const BreadcrumbCategories = {
  ...CE_BreadcrumbCategories,
  ...EE_BreadcrumbCategories,
};
