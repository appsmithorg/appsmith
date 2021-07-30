import React, { memo } from "react";
import styled from "styled-components";
import AppsmithLogo from "assets/images/appsmith_logo.png";
import Button, { Category, Size } from "components/ads/Button";
import HowAppsmithWorks from "./HowAppsmithWorks";
import { StyledLink } from "./common";
import { DISCORD_URL } from "constants/ThirdPartyConstants";

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
  margin-top: 72px;
`;

const StyledHeader = styled.h2`
  margin: 40px 0px 48px;
`;

const StyledButton = styled(Button)`
  width: 136px;
  height: 38px;
  margin: 0 auto;
`;

const Footer = styled.div`
  margin-top: 88px;
`;

type LandingPageProps = {
  onGetStarted: () => void;
};

export default memo(function LandingPage(props: LandingPageProps) {
  return (
    <LandingPageWrapper>
      <LandingPageContent>
        <LogoContainer>
          <AppsmithLogoImg alt="Appsmith logo" src={AppsmithLogo} />
        </LogoContainer>
        <StyledHeader>
          We’ll quickly get to know you, connect you to your data and your CRUD
          application will be ready in a jiffy!
        </StyledHeader>
        <HowAppsmithWorks />
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
