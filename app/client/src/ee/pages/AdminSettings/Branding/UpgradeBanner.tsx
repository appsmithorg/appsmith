export * from "ce/pages/AdminSettings/Branding/UpgradeBanner";

import React from "react";
import {
  ADMIN_BRANDING_SETTINGS_TITLE,
  ADMIN_BRANDING_SETTINGS_SUBTITLE,
  createMessage,
} from "@appsmith/constants/messages";

import {
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
} from "pages/AdminSettings/Authentication/AuthPage";

const UpgradeBanner = () => {
  return (
    <SettingsFormWrapper>
      <SettingsHeader
        color="var(--ads-v2-color-fg-emphasis-plus)"
        kind="heading-l"
        renderAs="h1"
      >
        {createMessage(ADMIN_BRANDING_SETTINGS_TITLE)}
      </SettingsHeader>
      <SettingsSubHeader
        color="var(--ads-v2-color-fg-emphasis)"
        kind="body-m"
        renderAs="h2"
      >
        {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE)}
      </SettingsSubHeader>
    </SettingsFormWrapper>
  );
};

export default UpgradeBanner;
