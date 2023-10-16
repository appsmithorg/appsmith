import React, { memo } from "react";
import styled from "styled-components";
import { ASSETS_CDN_URL } from "constants/ThirdPartyConstants";
import { useEffect } from "react";
import { playWelcomeAnimation } from "utils/helpers";
import {
  createMessage,
  WELCOME_BODY,
  WELCOME_HEADER,
} from "@appsmith/constants/messages";
import { SuperUserForm } from "./GetStarted";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const LandingPageWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 0 auto;
  overflow: auto;
  min-width: 800px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 6%;
`;

const StyledBannerHeader = styled.div`
  font-size: 72px;
  margin: 0px 0px;
  font-weight: 600;
  margin-right: 3rem;
  width: 100%;
  text-align: center;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

const StyledBannerBody = styled.div`
  font-size: 24px;
  margin: ${(props) => props.theme.spaces[7]}px 0px;
  font-weight: 500;
  margin-right: 9rem;
  width: 100%;
  text-align: center;
  color: var(--ads-v2-color-fg-emphasis);
`;

const StyledImageBanner = styled.div`
  width: 40%;
  display: flex;
  justify-content: center;
  height: 100%;
  flex-direction: column;
  align-items: end;
`;

const getWelcomeImage = () => `${ASSETS_CDN_URL}/welcome-banner-v2.svg`;
const getAppsmithLogo = () => `${ASSETS_CDN_URL}/appsmith-logo.svg`;

const WELCOME_PAGE_ANIMATION_CONTAINER = "welcome-page-animation-container";

function Banner() {
  return (
    <>
      <StyledBannerHeader>{createMessage(WELCOME_HEADER)}</StyledBannerHeader>
      <StyledBannerBody>{createMessage(WELCOME_BODY)}</StyledBannerBody>
    </>
  );
}

export default memo(function SuperUserWelcome() {
  useEffect(() => {
    playWelcomeAnimation(`#${WELCOME_PAGE_ANIMATION_CONTAINER}`);
  }, []);
  return (
    <LandingPageWrapper
      data-testid={"welcome-page"}
      id={WELCOME_PAGE_ANIMATION_CONTAINER}
    >
      <LandingPageContent>
        <StyledTextBanner>
          <Banner />
          <SuperUserForm />
        </StyledTextBanner>
        <StyledImageBanner>
          <div className="flex self-start w-2/6 h-16 ml-56">
            <img src={getAssetUrl(getAppsmithLogo())} />
          </div>
          <div className="flex w-5/6 my-1 h-4/6">
            <img className="w-full" src={getAssetUrl(getWelcomeImage())} />
          </div>
        </StyledImageBanner>
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
