import React from "react";
import styled from "styled-components";
import BEBannerImage from "assets/images/upgrade/be-cta/be-box-image.png";
import { ReactComponent as BETextContent } from "assets/svg/be-upgrade/upgrade-to-be-text.svg";
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
  background: linear-gradient(90deg, #fff 20px, transparent 1%) center,
    linear-gradient(#fff 20px, transparent 1%) center, #d2ddec;
  background-size: 22px 22px;
`;

export const ImageContainer = styled.div`
  display: flex;
  min-width: 500px;
  img {
    width: 500px;
    height: 500px;
  }
`;

export const FooterContainer = styled.div`
  display: flex;
  .upgrade-page-footer-container {
    width: calc(100% - 256px);
    margin-left: 256px;
    height: 90px;
    z-index: 2;
  }
`;

export const Overlay = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(70deg, #faf5ed 40%, transparent 60%);
  z-index: 1;
`;

export const FlexContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: calc(100% - 96px);
  width: 100%;
  padding: 48px 200px;
  overflow: auto;
`;

export const LeftWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const UpgradeToBEPage = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "ADMIN_SETTINGS_UPGRADE_HOOK",
    logEventData: { source: "Upgrade to BE" },
  });

  return (
    <UpgradeToBEPageWrapper>
      <Overlay>
        <FlexContainer>
          <LeftWrapper>
            <BETextContent />
          </LeftWrapper>
          <ImageContainer>
            <img alt="Upgrade to Business Edition" src={BEBannerImage} />
          </ImageContainer>
        </FlexContainer>
      </Overlay>
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
