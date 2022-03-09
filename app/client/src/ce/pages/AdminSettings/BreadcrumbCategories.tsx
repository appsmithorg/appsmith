import {
  APPLICATIONS_URL,
  getAdminSettingsCategoryUrl,
} from "constants/routes";
import { SettingCategories } from "@appsmith/pages/AdminSettings/config/types";

export const BreadcrumbCategories = {
  HOMEPAGE: {
    href: APPLICATIONS_URL,
    text: "Homepage",
  },
  [SettingCategories.GENERAL]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.GENERAL),
    text: "General",
  },
  [SettingCategories.EMAIL]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.EMAIL),
    text: "Email",
  },
  [SettingCategories.GOOGLE_MAPS]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.GOOGLE_MAPS),
    text: "Google Maps",
  },
  [SettingCategories.VERSION]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.VERSION),
    text: "Version",
  },
  [SettingCategories.ADVANCED]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.ADVANCED),
    text: "Advanced",
  },
  [SettingCategories.AUTHENTICATION]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.AUTHENTICATION),
    text: "Authentication",
  },
  [SettingCategories.FORM_AUTH]: {
    href: getAdminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.FORM_AUTH,
    ),
    text: "Form Login",
  },
  [SettingCategories.GOOGLE_AUTH]: {
    href: getAdminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.GOOGLE_AUTH,
    ),
    text: "Google Authentication",
  },
  [SettingCategories.GITHUB_AUTH]: {
    href: getAdminSettingsCategoryUrl(
      SettingCategories.AUTHENTICATION,
      SettingCategories.GITHUB_AUTH,
    ),
    text: "Github Authentication",
  },
};
