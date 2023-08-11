import React from "react";
import { Button } from "design-system";
import { ContentBox } from "pages/Settings/components";
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
import styled from "styled-components";
import BusinessTag from "components/BusinessTag";

const StyledSettingsSubHeader = styled(SettingsSubHeader)`
  margin: 0;
`;

const UpgradeBanner = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "BRANDING_UPGRADE_CLICK",
  });

  return (
    <div className="pb-4 pr-7">
      <ContentBox className="flex items-center justify-between p-6 border upgrade-banner">
        <main>
          <BusinessTag />
          <SettingsHeader
            className="mt-1"
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {createMessage(ADMIN_BRANDING_SETTINGS_TITLE)}
          </SettingsHeader>
          <StyledSettingsSubHeader
            className="w-7/12 mt-1"
            color="var(--ads-v2-color-fg-emphasis)"
            kind="body-m"
            renderAs="h2"
          >
            {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE)}
          </StyledSettingsSubHeader>
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
