import React, { memo, useEffect } from "react";
import styled from "styled-components";
import {
  createMessage,
  WELCOME_BODY,
  WELCOME_HEADER,
} from "@appsmith/constants/messages";
import NonSuperUserProfilingQuestions from "./NonSuperUserProfilingQuestions";
import AnalyticsUtil from "utils/AnalyticsUtil";
import WelcomeBackground from "./WelcomeBackground";
import SetupForm from "./SetupForm";

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

const StyledTextBanner = styled.div<{ isSuperUser?: boolean }>`
  width: 60%;
  height: 100%;
  display: flex;
  flex-direction: column;
  ${(props) =>
    props.isSuperUser
      ? "padding: var(--ads-spaces-17) 0 0;"
      : "justify-content: center;"}
  margin-left: 8rem;
`;

const StyledBannerHeader = styled.div`
  font-size: 40px;
  margin: 0px;
  font-weight: 600;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

const StyledBannerBody = styled.div`
  font-size: 24px;
  margin: 0px;
  font-weight: 500;
  color: var(--ads-v2-color-fg-emphasis);
`;

const ActionContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;

interface LandingPageProps {
  onGetStarted?: (proficiency?: string, useCase?: string) => void;
  isSuperUser: boolean;
}

export default memo(function UserWelcomeScreen(props: LandingPageProps) {
  useEffect(() => {
    if (!props.isSuperUser)
      AnalyticsUtil.logEvent("PAGE_VIEW", {
        pageType: "profilingQuestions",
      });
  }, []);

  return (
    <LandingPageWrapper data-testid={"welcome-page"}>
      <LandingPageContent>
        <StyledTextBanner isSuperUser={props.isSuperUser}>
          <StyledBannerHeader>
            {createMessage(WELCOME_HEADER)}
          </StyledBannerHeader>
          {props.isSuperUser && (
            <StyledBannerBody>{createMessage(WELCOME_BODY)}</StyledBannerBody>
          )}
          {props.isSuperUser ? (
            <ActionContainer>
              <SetupForm />
            </ActionContainer>
          ) : (
            <NonSuperUserProfilingQuestions onGetStarted={props.onGetStarted} />
          )}
        </StyledTextBanner>
        <WelcomeBackground />
      </LandingPageContent>
    </LandingPageWrapper>
  );
});
