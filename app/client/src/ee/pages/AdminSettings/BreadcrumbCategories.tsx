export * from "ce/pages/AdminSettings/BreadcrumbCategories";
import { BreadcrumbCategories as CE_BreadcrumbCategories } from "ce/pages/AdminSettings/BreadcrumbCategories";
import { SettingCategories } from "./config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";

const EE_BreadcrumbCategories = {
  [SettingCategories.SAML_AUTH]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
      subCategory: SettingCategories.SAML_AUTH,
    }),
    text: "SSO Authentication",
  },
  [SettingCategories.OIDC_AUTH]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
      subCategory: SettingCategories.OIDC_AUTH,
    }),
    text: "OIDC Authentication",
  },
};

export const BreadcrumbCategories = {
  ...CE_BreadcrumbCategories,
  ...EE_BreadcrumbCategories,
};
