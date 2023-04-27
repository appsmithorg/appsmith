import React, { memo, useState } from "react";
import styled from "styled-components";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { useEffect } from "react";
import { playWelcomeAnimation } from "utils/helpers";
import {
  createMessage,
  WELCOME_BODY,
  WELCOME_HEADER,
} from "@appsmith/constants/messages";
import NonSuperUserForm, { SuperUserForm } from "./GetStarted";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const LandingPageWrapper = styled.div<{ hide: boolean }>`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0 auto;
  opacity: ${(props) => (props.hide ? 0 : 1)};
`;

const LandingPageContent = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 100;
  justify-content: space-between;
`;

const StyledTextBanner = styled.div`
  min-width: ${(props) => props.theme.pageContentWidth * 0.55}px;
  padding-left: 64px;
  width: 50%;
  margin-left: 20%;
  margin-top: 7%;
`;

const StyledBannerHeader = styled.h1`
  font-size: 72px;
  margin: 0px 0px;
  font-weight: 600;
`;

const StyledBannerBody = styled.p`
  font-size: 24px;
  margin: ${(props) => props.theme.spaces[7]}px 0px;
  width: 400px;
  font-weight: 500;
`;

const StyledImageBanner = styled.div`
  min-width: ${(props) => props.theme.pageContentWidth * 0.45}px;
`;

const getWelcomeImage = () => `${ASSETS_CDN_URL}/welcome-banner-v2.svg`;

type LandingPageProps = {
  onGetStarted?: (role?: string, useCase?: string) => void;
  forSuperUser: boolean;
};

const WELCOME_PAGE_ANIMATION_CONTAINER = "welcome-page-animation-container";

function Banner() {
  return (
    <>
      <StyledBannerHeader>{createMessage(WELCOME_HEADER)}</StyledBannerHeader>
      <StyledBannerBody>{createMessage(WELCOME_BODY)}</StyledBannerBody>
    </>
  );
}

export default memo(function LandingPage(props: LandingPageProps) {
  const [fontsInjected, setFontsInjected] = useState(false);
  useEffect(() => {
    playWelcomeAnimation(`#${WELCOME_PAGE_ANIMATION_CONTAINER}`);
    //wait for the fonts to be loaded
    setTimeout(() => {
      setFontsInjected(true);
    }, 100);
  }, []);
  return (
    <LandingPageWrapper
      data-testid={"welcome-page"}
      hide={!fontsInjected}
      id={WELCOME_PAGE_ANIMATION_CONTAINER}
    >
      <LandingPageContent>
        <StyledTextBanner>
          <Banner />
          {props.forSuperUser ? <SuperUserForm /> : <NonSuperUserForm />}
        </StyledTextBanner>
        <StyledImageBanner>
          <img src={getAssetUrl(getWelcomeImage())} />
        </StyledImageBanner>
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
