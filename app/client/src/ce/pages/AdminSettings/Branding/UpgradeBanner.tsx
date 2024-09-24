import React from "react";
import { Button } from "@appsmith/ads";
import { ContentBox } from "pages/AdminSettings/components";
import {
  ADMIN_BRANDING_SETTINGS_SUBTITLE_UPGRADE,
  ADMIN_BRANDING_SETTINGS_TITLE_UPGRADE,
  createMessage,
} from "ee/constants/messages";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import {
  SettingsHeader,
  SettingsSubHeader,
} from "pages/AdminSettings/Authentication/AuthPage";
import styled from "styled-components";
import BusinessTag from "components/BusinessTag";
import { RampFeature, RampSection } from "utils/ProductRamps/RampsControlList";

const StyledSettingsSubHeader = styled(SettingsSubHeader)`
  margin: 0;
`;

const UpgradeBanner = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "BRANDING_UPGRADE_CLICK",
    featureName: RampFeature.Branding,
    sectionName: RampSection.AdminSettings,
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
            {createMessage(ADMIN_BRANDING_SETTINGS_TITLE_UPGRADE)}
          </SettingsHeader>
          <StyledSettingsSubHeader
            className="w-7/12 mt-1"
            color="var(--ads-v2-color-fg-emphasis)"
            kind="body-m"
            renderAs="h2"
          >
            {createMessage(ADMIN_BRANDING_SETTINGS_SUBTITLE_UPGRADE)}
          </StyledSettingsSubHeader>
        </main>
        <aside>
          <Button data-testid="t--button-upgrade" onClick={onUpgrade} size="md">
            Upgrade
          </Button>
        </aside>
      </ContentBox>
    </div>
  );
};

export default UpgradeBanner;
