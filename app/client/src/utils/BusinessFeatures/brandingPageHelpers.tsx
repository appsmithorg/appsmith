// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { default as UpgradeBanner_CE } from "ce/pages/AdminSettings/config/branding/UpgradeBanner";
import { default as UpgradeBanner_EE } from "ee/pages/AdminSettings/config/branding/UpgradeBanner";
import React from "react";

export const getUpgradeBanner = (isEnabled: boolean) => {
  if (isEnabled) {
    return <UpgradeBanner_EE />;
  } else return <UpgradeBanner_CE />;
};
