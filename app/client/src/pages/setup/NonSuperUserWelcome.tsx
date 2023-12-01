import React, { memo, useEffect } from "react";
import styled from "styled-components";
import { createMessage, WELCOME_HEADER } from "@appsmith/constants/messages";
import NonSuperUserForm from "./GetStarted";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import AnalyticsUtil from "utils/AnalyticsUtil";

const LandingPageWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0 auto;
  overflow: auto;
  min-width: 800px;
  background: var(--ads-v2-color-gray-50);
`;

const LandingPageContent = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: start;
  justify-content: center;
  position: relative;
  z-index: 100;
`;

const StyledTextBanner = styled.div`
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 8rem;
`;

const StyledBannerHeader = styled.div`
  font-size: 40px;
  margin: 0px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

const StyledImageBanner = styled.div`
  width: 50%;
  display: flex;
  height: 100%;
  position: relative;
  overflow: hidden;
  /* Animations */
  @keyframes falling-confetti {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 0 972px;
    }
  }
`;

const LayerImage = styled.div`
  width: 100%; /* Adjust the image width as needed */
  height: 100%;
  position: absolute; /* Position the image absolutely within the container */
  top: 0;
  left: 0;
  background-size: auto 972px;
  background-repeat: repeat;
  &#layer1 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-1.png`)});
    animation: falling-confetti 7s linear infinite;
  }
  &#layer2 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-2.png`)});
    animation: falling-confetti 10s linear infinite;
  }
  &#layer3 {
    background-image: url(${getAssetUrl(`${ASSETS_CDN_URL}/layer-3.png`)});
    animation: falling-confetti 15s linear infinite;
  }
`;

const ElementImage = styled.img`
  position: absolute;
  width: 300px;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
`;

interface LandingPageProps {
  onGetStarted?: (proficiency?: string, useCase?: string) => void;
}

export default memo(function NonSuperUserWelcome(props: LandingPageProps) {
  useEffect(() => {
    AnalyticsUtil.logEvent("PAGE_VIEW", {
      pageType: "profilingQuestions",
    });
  }, []);

  return (
    <LandingPageWrapper data-testid={"welcome-page"}>
      <LandingPageContent>
        <StyledTextBanner>
          <StyledBannerHeader>
            {createMessage(WELCOME_HEADER)}
          </StyledBannerHeader>
          <NonSuperUserForm onGetStarted={props.onGetStarted} />
        </StyledTextBanner>
        <StyledImageBanner>
          <LayerImage id="layer3" />
          <LayerImage id="layer2" />
          <ElementImage src={getAssetUrl(`${ASSETS_CDN_URL}/profiling.png`)} />
          <LayerImage id="layer1" />
        </StyledImageBanner>
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
