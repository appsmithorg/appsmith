import React from "react";
import { Button } from "design-system";
import { ContentBox } from "pages/Settings/components";
import {
  ADMIN_BRANDING_SETTINGS_SUBTITLE,
  ADMIN_BRANDING_SETTINGS_TITLE,
  ADMIN_BRANDING_UPGRADE_INTERCOM_MESSAGE,
  createMessage,
} from "@appsmith/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import {
  SettingsHeader,
  SettingsSubHeader,
} from "@appsmith/pages/AdminSettings/config/authentication/AuthPage";

const UpgradeBanner = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "BRANDING_UPGRADE_CLICK",
    intercomMessage: createMessage(ADMIN_BRANDING_UPGRADE_INTERCOM_MESSAGE),
  });

  return (
    <div className="pb-4 pr-7">
      <ContentBox className="flex items-center justify-between p-6 border">
        <main>
          <div className="inline-block px-1 text-xs text-blue-900 uppercase bg-blue-100">
            Business
          </div>
          <SettingsHeader
            className="mt-1"
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h2"
          >
            {createMessage(ADMIN_BRANDING_SETTINGS_TITLE)}
          </SettingsHeader>
          <SettingsSubHeader
            className="w-7/12 mt-1"
            color="var(--ads-v2-color-fg-emphasis)"
            renderAs="p"
          >
            {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE)}
          </SettingsSubHeader>
        </main>
        <aside>
          <Button onClick={onUpgrade} size="md" startIcon="star-line">
            Upgrade
          </Button>
        </aside>
      </ContentBox>
    </div>
  );
};

export default UpgradeBanner;
