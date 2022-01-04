import React from "react";
import Breadcrumbs from "components/ads/Breadcrumbs";
import { IBreadcrumbProps } from "@blueprintjs/core";
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
  DEFAULT_SETTINGS: {
    href: getAdminSettingsCategoryUrl(SettingCategories.GENERAL),
    text: "Settings",
  },
  [SettingCategories.GENERAL]: {
    href: getAdminSettingsCategoryUrl(SettingCategories.GENERAL),
    text: "Settings",
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

export const getBreadcrumbList = (category: string, subCategory?: string) => {
  const breadcrumbList: IBreadcrumbProps[] = [
    BreadcrumbCategories.HOMEPAGE,
    ...(category !== "general" ? [BreadcrumbCategories.DEFAULT_SETTINGS] : []),
    ...(subCategory
      ? [BreadcrumbCategories[category], BreadcrumbCategories[subCategory]]
      : [BreadcrumbCategories[category]]),
  ];

  return breadcrumbList;
};

function SettingsBreadcrumbs({
  category,
  subCategory,
}: {
  category: string;
  subCategory?: string;
}) {
  return <Breadcrumbs items={getBreadcrumbList(category, subCategory)} />;
}

export default SettingsBreadcrumbs;
