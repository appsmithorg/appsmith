import React, { memo, useEffect } from "react";
import {
  createMessage,
  WELCOME_BODY,
  WELCOME_HEADER,
} from "ee/constants/messages";
import NonSuperUserProfilingQuestions from "./NonSuperUserProfilingQuestions";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import WelcomeBackground from "./WelcomeBackground";
import SetupForm from "./SetupForm";
import {
  UserWelcomeScreenWrapper,
  UserWelcomeScreenContent,
  UserWelcomeScreenTextBanner,
  UserWelcomeScreenBannerHeader,
  UserWelcomeScreenBannerBody,
  UserWelcomeScreenActionContainer,
} from "./common";

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
    <UserWelcomeScreenWrapper data-testid={"welcome-page"}>
      <UserWelcomeScreenContent>
        <UserWelcomeScreenTextBanner isSuperUser={props.isSuperUser}>
          <UserWelcomeScreenBannerHeader>
            {createMessage(WELCOME_HEADER)}
          </UserWelcomeScreenBannerHeader>
          {props.isSuperUser && (
            <UserWelcomeScreenBannerBody>
              {createMessage(WELCOME_BODY)}
            </UserWelcomeScreenBannerBody>
          )}
          {props.isSuperUser ? (
            <UserWelcomeScreenActionContainer>
              <SetupForm />
            </UserWelcomeScreenActionContainer>
          ) : (
            <NonSuperUserProfilingQuestions onGetStarted={props.onGetStarted} />
          )}
        </UserWelcomeScreenTextBanner>
        <WelcomeBackground />
      </UserWelcomeScreenContent>
    </UserWelcomeScreenWrapper>
  );
});
