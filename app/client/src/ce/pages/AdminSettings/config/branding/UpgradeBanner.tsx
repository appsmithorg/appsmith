import React from "react";
import { Button } from "design-system";

import {
  ADMIN_BRANDING_SETTINGS_SUBTITLE,
  ADMIN_BRANDING_SETTINGS_TITLE,
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
    intercomMessage:
      "Hello, I would like to upgrade my appsmith instance to use the custom branding feature",
  });

  return (
    <div className="pb-4 pr-7">
      <div className="flex items-center justify-between p-6 border">
        <main>
          <div className="inline-block px-1 text-xs text-blue-900 uppercase bg-blue-100">
            Business
          </div>
          <SettingsHeader className="mt-1">
            {createMessage(ADMIN_BRANDING_SETTINGS_TITLE)}
          </SettingsHeader>
          <SettingsSubHeader className="w-7/12 mt-1">
            {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE)}
          </SettingsSubHeader>
        </main>
        <aside>
          <Button
            className="w-max min-w-48"
            icon="star-line"
            iconPosition="left"
            onClick={onUpgrade}
            size="large"
            text="UPGRADE"
          />
        </aside>
      </div>
    </div>
  );
};

export default UpgradeBanner;
