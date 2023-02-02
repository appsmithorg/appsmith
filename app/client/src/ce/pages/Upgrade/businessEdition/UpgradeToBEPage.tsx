import React from "react";
import styled from "styled-components";
import UpgradeToBusinessEdition from "assets/images/upgrade/be-cta/upgrade-to-be.png";
import {
  createMessage,
  MOVE_TO_BUSINESS_EDITION,
} from "@appsmith/constants/messages";
import { FooterComponent } from "../Footer";
import useOnUpgrade from "utils/hooks/useOnUpgrade";

export const UpgradeToBEPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

export const ImageContainer = styled.div`
  display: flex;
  height: calc(100% - 86px);
  width: 100%;
  img {
    object-fit: fill;
    width: 100%;
    height: 100%;
  }
`;

export const FooterContainer = styled.div`
  display: flex;
  .upgrade-page-footer-container {
    margin-left: 256px;
    height: 90px;
  }
`;

export const UpgradeToBEPage = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_HOOK",
    logEventData: { source: "Upgrade to BE" },
  });

  return (
    <UpgradeToBEPageWrapper>
      <ImageContainer>
        <img
          alt="Upgrade to Business Edition"
          key="upgrade-to-business-edition"
          src={UpgradeToBusinessEdition}
        />
      </ImageContainer>
      <FooterContainer>
        <FooterComponent
          message={createMessage(MOVE_TO_BUSINESS_EDITION, "?")}
          onClick={() => onUpgrade()}
          showHeading={false}
        />
      </FooterContainer>
    </UpgradeToBEPageWrapper>
  );
};
