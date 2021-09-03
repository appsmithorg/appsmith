import React, { memo } from "react";
import styled from "styled-components";
import AppsmithLogo from "assets/images/appsmith_logo.png";
import Button, { Category, Size } from "components/ads/Button";
import { StyledLink } from "./common";
import { DISCORD_URL } from "constants/ThirdPartyConstants";
import { useEffect } from "react";
import { playOnboardingAnimation } from "utils/helpers";

const LandingPageWrapper = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const LandingPageContent = styled.div`
  width: 735px;
  text-align: center;
`;

const LogoContainer = styled.div``;

const AppsmithLogoImg = styled.img`
  max-width: 170px;
`;

const ActionContainer = styled.div`
  margin-top: 32px;
`;

const StyledBanner = styled.h2`
  margin: 16px 0px;
  font-weight: 500;
  color: ${(props) => props.theme.colors.welcomePage.text};
`;

const StyledButton = styled(Button)`
  width: 136px;
  height: 38px;
  margin: 0 auto;
`;

const Footer = styled.div`
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translate(-50%, 0);
`;

type LandingPageProps = {
  onGetStarted: () => void;
};

export default memo(function LandingPage(props: LandingPageProps) {
  useEffect(() => {
    playOnboardingAnimation();
  }, []);
  return (
    <LandingPageWrapper>
      <LandingPageContent>
        <LogoContainer>
          <AppsmithLogoImg alt="Appsmith logo" src={AppsmithLogo} />
        </LogoContainer>
        <StyledBanner>
          Thank you for trying Appsmith.
          <br />
          You’ll be building your new app very soon!
        </StyledBanner>
        <StyledBanner>
          We have a few questions to set up your account.
        </StyledBanner>
        <ActionContainer>
          <StyledButton
            category={Category.primary}
            onClick={props.onGetStarted}
            size={Size.medium}
            tag="button"
            text="Get Started"
          />
        </ActionContainer>
        <Footer>
          For more queries reach us on our&nbsp;
          <StyledLink href={DISCORD_URL} rel="noreferrer" target="_blank">
            Discord Server
          </StyledLink>
        </Footer>
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
