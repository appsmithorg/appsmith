import React from "react";
import { Button } from "design-system";

import {
  ADMIN_BRANDING_UPGRADE_BANNER_SUBTITLE,
  ADMIN_BRANDING_UPGRADE_BANNER_TITLE,
  createMessage,
} from "@appsmith/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import {
  SettingsHeader,
  SettingsSubHeader,
} from "@appsmith/pages/AdminSettings/config/authentication/AuthPage";

const UpgradeBanner = () => {
  const { onUpgrade } = useOnUpgrade({});

  return (
    <div className="pb-4 pr-7">
      <div className="flex items-center p-4 border">
        <main>
          <div className="inline-block px-1 text-xs text-blue-900 uppercase bg-blue-100">
            Enterprise
          </div>
          <SettingsHeader className="mt-1">
            {createMessage(ADMIN_BRANDING_UPGRADE_BANNER_TITLE)}
          </SettingsHeader>
          <SettingsSubHeader className="w-7/12 mt-1">
            {createMessage(ADMIN_BRANDING_UPGRADE_BANNER_SUBTITLE)}
          </SettingsSubHeader>
        </main>
        <aside>
          <Button
            icon="star-line"
            iconPosition="left"
            onClick={onUpgrade}
            size="large"
            text="UPGRADE NOW"
          />
        </aside>
      </div>
    </div>
  );
};

export default UpgradeBanner;
