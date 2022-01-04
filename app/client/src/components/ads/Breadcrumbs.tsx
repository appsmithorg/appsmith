import React from "react";
import styled from "styled-components";
import {
  Breadcrumbs as BPBreadcrumbs,
  Breadcrumb,
  IBreadcrumbProps,
} from "@blueprintjs/core";
import {
  APPLICATIONS_URL,
  getAdminSettingsCategoryUrl,
} from "constants/routes";
import { SettingCategories } from "ce/pages/AdminSettings/config/types";

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

interface BreadcrumbProps {
  items: IBreadcrumbProps[];
}

const renderCurrentBreadcrumb = ({ text, ...restProps }: IBreadcrumbProps) => {
  // customize rendering of last breadcrumb
  return <Breadcrumb {...restProps}>{text}</Breadcrumb>;
};

const StyledBreadcrumbs = styled(BPBreadcrumbs)`
  &.bp3-overflow-list {
    > li {
      .bp3-breadcrumb {
        font-size: 12px;
      }
    }
  }
`;

function Breadcrumbs(props: BreadcrumbProps) {
  return (
    <StyledBreadcrumbs
      currentBreadcrumbRenderer={renderCurrentBreadcrumb}
      items={props.items}
    />
  );
}

export default Breadcrumbs;
