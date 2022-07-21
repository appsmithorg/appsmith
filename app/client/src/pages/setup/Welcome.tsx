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

const LandingPageWrapper = styled.div<{ hide: boolean }>`
  width: ${(props) => props.theme.pageContentWidth}px;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  opacity: ${(props) => (props.hide ? 0 : 1)};
`;

const LandingPageContent = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 100;
`;

const StyledTextBanner = styled.div`
  min-width: ${(props) => props.theme.pageContentWidth * 0.55}px;
  padding-left: 64px;
`;

const StyledBannerHeader = styled.h1`
  font-family: "Paytone One", sans-serif;
  font-size: 72px;
  margin: 0px 0px;
`;

const StyledBannerBody = styled.p`
  font-family: "Montserrat", sans-serif;
  font-size: 24px;
  margin: ${(props) => props.theme.spaces[7]}px 0px;
  width: 400px;
`;

const StyledImageBanner = styled.div`
  min-width: ${(props) => props.theme.pageContentWidth * 0.45}px;
`;

const StyledImage = styled.img``;

const getWelcomeImage = () => `${ASSETS_CDN_URL}/welcome-banner.svg`;

type LandingPageProps = {
  onGetStarted?: (role?: string, useCase?: string) => void;
  forSuperUser: boolean;
};

const WELCOME_PAGE_ANIMATION_CONTAINER = "welcome-page-animation-container";

const includeFonts = () => {
  const preconnectGoogleapis = document.createElement("link");
  preconnectGoogleapis.rel = "preconnect";
  preconnectGoogleapis.href = "https://fonts.googleapis.com";
  document.head.appendChild(preconnectGoogleapis);

  const preconnectGstatic = document.createElement("link") as any;
  preconnectGstatic.rel = "preconnect";
  preconnectGstatic.href = "https://fonts.gstatic.com";
  preconnectGstatic.crossorigin = "crossorigin";
  document.head.appendChild(preconnectGstatic);

  const fonts = document.createElement("link");
  fonts.rel = "stylesheet";
  fonts.href =
    "https://fonts.googleapis.com/css2?family=Montserrat&family=Paytone+One&display=swap";
  document.head.appendChild(fonts);
};

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
    includeFonts();
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
          {props.forSuperUser ? (
            <SuperUserForm onGetStarted={props.onGetStarted} />
          ) : (
            <NonSuperUserForm onGetStarted={props.onGetStarted} />
          )}
        </StyledTextBanner>
        <StyledImageBanner>
          <StyledImage src={getWelcomeImage()} />
        </StyledImageBanner>
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
