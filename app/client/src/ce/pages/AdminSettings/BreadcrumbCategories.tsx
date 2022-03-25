import { APPLICATIONS_URL, adminSettingsCategoryUrl } from "constants/routes";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";

export const BreadcrumbCategories = {
  HOMEPAGE: {
    href: APPLICATIONS_URL,
    text: "Homepage",
  },
  [SettingCategories.GENERAL]: {
    href: adminSettingsCategoryUrl(SettingCategories.GENERAL),
    text: "General",
  },
  [SettingCategories.EMAIL]: {
    href: adminSettingsCategoryUrl(SettingCategories.EMAIL),
    text: "Email",
  },
  [SettingCategories.GOOGLE_MAPS]: {
    href: adminSettingsCategoryUrl(SettingCategories.GOOGLE_MAPS),
    text: "Google Maps",
  },
  [SettingCategories.VERSION]: {
    href: adminSettingsCategoryUrl(SettingCategories.VERSION),
    text: "Version",
  },
  [SettingCategories.ADVANCED]: {
    href: adminSettingsCategoryUrl(SettingCategories.ADVANCED),
    text: "Advanced",
  },
  [SettingCategories.AUTHENTICATION]: {
    href: adminSettingsCategoryUrl(SettingCategories.AUTHENTICATION),
    text: "Authentication",
  },
  [SettingCategories.FORM_AUTH]: {
    href: adminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.FORM_AUTH,
    ),
    text: "Form Login",
  },
  [SettingCategories.GOOGLE_AUTH]: {
    href: adminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.GOOGLE_AUTH,
    ),
    text: "Google Authentication",
  },
  [SettingCategories.GITHUB_AUTH]: {
    href: adminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.GITHUB_AUTH,
    ),
    text: "Github Authentication",
  },
};
