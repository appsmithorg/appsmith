import React from "react";
import styled from "styled-components";
import BETextImage from "assets/svg/be-upgrade/upgrade-to-be-text.svg";
import BECtaImage from "assets/svg/be-upgrade/be-cta.svg";
import {
  createMessage,
  MOVE_TO_BUSINESS_EDITION,
} from "@appsmith/constants/messages";
import { FooterComponent } from "../Footer";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import { Colors } from "constants/Colors";

export const UpgradeToBEPageWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #fff 20px, transparent 1%) center,
    linear-gradient(#fff 20px, transparent 1%) center, #d2ddec;
  background-size: 22px 22px;
`;

export const ImageContainer = styled.div`
  min-width: 400px;
  img {
    width: 600px;
    height: 600px;
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
  background: linear-gradient(
    70deg,
    ${Colors.APPSMITH_BEIGE} 40%,
    transparent 60%
  );
  z-index: 1;
`;

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  height: calc(100% - 96px);
  width: 100%;
  justify-content: center;
  min-width: 1200px;
`;

export const LeftWrapper = styled.div`
  min-width: 700px;
  img {
    width: 1000px;
    height: 1000px;
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  width: 1000px;
  flex-direction: row;
  padding: 48px 200px;
  align-items: center;
  justify-content: center;
  min-width: 900px;
`;

export const UpgradeToBEPage = () => {
  const { onUpgrade } = useOnUpgrade({
    logEventName: "BILLING_UPGRADE_ADMIN_SETTINGS",
    logEventData: { source: "Upgrade" },
  });

  return (
    <UpgradeToBEPageWrapper>
      <Overlay>
        <FlexContainer className="flex-container">
          <ContentWrapper className="content-wrapper">
            <LeftWrapper>
              <img alt="text-content" src={BETextImage} />
            </LeftWrapper>
            <ImageContainer>
              <img alt="Upgrade to Business Edition" src={BECtaImage} />
            </ImageContainer>
          </ContentWrapper>
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
