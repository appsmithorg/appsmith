/* eslint-disable @typescript-eslint/no-restricted-imports */
import { default as UpgradeBanner_CE } from "ce/pages/AdminSettings/Branding/UpgradeBanner";
import { default as UpgradeBanner_EE } from "@appsmith/pages/AdminSettings/Branding/UpgradeBanner";
import React from "react";
import {
  useHtmlPageTitle as useHtmlPageTitle_CE,
  getPageTitle as getPageTitle_CE,
} from "ce/utils";
import {
  useHtmlPageTitle as useHtmlPageTitle_EE,
  getPageTitle as getPageTitle_EE,
} from "@appsmith/utils";

export const getUpgradeBanner = (isEnabled: boolean) => {
  if (isEnabled) {
    return <UpgradeBanner_EE />;
  } else return <UpgradeBanner_CE />;
};

export const getHTMLPageTitle = (isEnabled: boolean) => {
  if (isEnabled) {
    return useHtmlPageTitle_EE;
  } else {
    return useHtmlPageTitle_CE;
  }
};

export const getPageTitle = (
  isEnabled: boolean,
  displayName: string | undefined,
  titleSuffix: string | undefined,
) => {
  if (isEnabled) {
    return getPageTitle_EE(displayName, titleSuffix);
  } else {
    return getPageTitle_CE(displayName, titleSuffix);
  }
};
