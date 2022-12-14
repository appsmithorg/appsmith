export * from "ce/pages/AdminSettings/config/branding/UpgradeBanner";

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
} from "@appsmith/pages/AdminSettings/config/authentication/AuthPage";

const UpgradeBanner = () => {
  return (
    <SettingsFormWrapper>
      <SettingsHeader>
        {createMessage(ADMIN_BRANDING_SETTINGS_TITLE)}
      </SettingsHeader>
      <SettingsSubHeader>
        {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE)}
      </SettingsSubHeader>
    </SettingsFormWrapper>
  );
};

export default UpgradeBanner;
