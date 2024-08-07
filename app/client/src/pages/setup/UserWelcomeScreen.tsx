import React, { memo, useEffect } from "react";
import styled from "styled-components";
import {
  createMessage,
  WELCOME_BODY,
  WELCOME_HEADER,
} from "ee/constants/messages";
import NonSuperUserProfilingQuestions from "./NonSuperUserProfilingQuestions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
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
      ? "padding: calc(2*var(--ads-spaces-17)) 0 0;"
      : "justify-content: center;"}
  margin-left: 8rem;
`;

const StyledBannerHeader = styled.div`
  font-size: calc(2 * var(--ads-v2-font-size-10));
  margin: 0px;
  font-weight: var(--ads-font-weight-bold-xl);
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
  // To have a get started button click function for non super user form
  onGetStarted?: (proficiency?: string, useCase?: string) => void;
  // Property to determine whether the user is super admin or not
  isSuperUser: boolean;
}

export default memo(function UserWelcomeScreen(props: LandingPageProps) {
  const logEvent = () => {
    AnalyticsUtil.logEvent("PAGE_VIEW", {
      pageType: "profilingQuestions",
      isSuperUser: !!props.isSuperUser,
    });
  };

  useEffect(() => {
    logEvent();
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
