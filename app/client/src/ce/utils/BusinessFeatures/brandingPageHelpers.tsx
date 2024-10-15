/* eslint-disable @typescript-eslint/no-restricted-imports */
import { default as UpgradeBanner_CE } from "ce/pages/AdminSettings/Branding/UpgradeBanner";
import { default as UpgradeBanner_EE } from "@appsmith/pages/AdminSettings/Branding/UpgradeBanner";
import React from "react";
import { getPageTitle as getPageTitle_CE } from "ce/utils";
import { getPageTitle as getPageTitle_EE } from "@appsmith/utils";

export const getUpgradeBanner = (isEnabled: boolean) => {
  if (isEnabled) {
    return <UpgradeBanner_EE />;
  } else return <UpgradeBanner_CE />;
};

export const getHTMLPageTitle = () => {
  return "YuChat Admin";
  // if (isEnabled) {
  //   return getHtmlPageTitle_EE(instanceName);
  // } else {
  //   return getHtmlPageTitle_CE(instanceName);
  // }
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
