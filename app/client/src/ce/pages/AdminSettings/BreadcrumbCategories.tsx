import { APPLICATIONS_URL } from "constants/routes";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";
import { adminSettingsCategoryUrl } from "RouteBuilder";

export const BreadcrumbCategories = {
  HOMEPAGE: {
    href: APPLICATIONS_URL,
    text: "Homepage",
  },
  [SettingCategories.GENERAL]: {
    href: adminSettingsCategoryUrl({ category: SettingCategories.GENERAL }),
    text: "General",
  },
  [SettingCategories.EMAIL]: {
    href: adminSettingsCategoryUrl({ category: SettingCategories.EMAIL }),
    text: "Email",
  },
  [SettingCategories.GOOGLE_MAPS]: {
    href: adminSettingsCategoryUrl({ category: SettingCategories.GOOGLE_MAPS }),
    text: "Google Maps",
  },
  [SettingCategories.VERSION]: {
    href: adminSettingsCategoryUrl({ category: SettingCategories.VERSION }),
    text: "Version",
  },
  [SettingCategories.ADVANCED]: {
    href: adminSettingsCategoryUrl({ category: SettingCategories.ADVANCED }),
    text: "Advanced",
  },
  [SettingCategories.AUTHENTICATION]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
    }),
    text: "Authentication",
  },
  [SettingCategories.FORM_AUTH]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
      selected: SettingCategories.FORM_AUTH,
    }),
    text: "Form Login",
  },
  [SettingCategories.GOOGLE_AUTH]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
      selected: SettingCategories.GOOGLE_AUTH,
    }),
    text: "Google Authentication",
  },
  [SettingCategories.GITHUB_AUTH]: {
    href: adminSettingsCategoryUrl({
      category: SettingCategories.AUTHENTICATION,
      selected: SettingCategories.GITHUB_AUTH,
    }),
    text: "Github Authentication",
  },
};
