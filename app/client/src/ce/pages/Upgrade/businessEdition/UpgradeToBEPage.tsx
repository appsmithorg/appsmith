import React from "react";
import styled from "styled-components";
import {
  createMessage,
  MOVE_TO_BUSINESS_EDITION,
} from "@appsmith/constants/messages";
import { FooterComponent } from "../Footer";
import useOnUpgrade from "utils/hooks/useOnUpgrade";
import { Colors } from "constants/Colors";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";

export const UpgradeToBEPageWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #fff 20px, transparent 1%) center,
    linear-gradient(#fff 20px, transparent 1%) center, #d2ddec;
  background-size: 22px 22px;
`;

export const ImageContainer = styled.div`
  margin-right: 32px;
  img {
    height: calc(100vh - 400px);
    object-fit: contain;
  }
`;

export const FooterContainer = styled.div`
  display: flex;
  .upgrade-page-footer-container {
    width: calc(100% - 256px);
    margin-left: 256px;
    height: 90px;
    z-index: 2;
    .left {
      min-width: 100px;
    }
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
  width: 100%;
  height: calc(100% - 96px);
  justify-content: center;
`;

export const LeftWrapper = styled.div`
  margin-left: 32px;
  img {
    object-fit: contain;
    height: calc(100vh - 200px);
  }
`;

export const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  overflow: hidden;
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
              <img
                alt="text-content"
                src={`${ASSETS_CDN_URL}/business-features.svg`}
              />
            </LeftWrapper>
            <ImageContainer>
              <img
                alt="Upgrade to Business Edition"
                src={`${ASSETS_CDN_URL}/upgrade-box.svg`}
              />
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
