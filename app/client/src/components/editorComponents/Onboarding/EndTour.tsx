import { endOnboarding } from "actions/onboardingActions";
import React from "react";
import { useDispatch } from "react-redux";
import { showWelcomeScreen } from "selectors/onboardingSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const EndTourText = styled.span`
  font-size: 12px;
  color: #d8d8d8;
  align-self: center;
  cursor: pointer;
`;

function EndTour() {
  const dispatch = useDispatch();
  const showingWelcomeScreen = useSelector(showWelcomeScreen);

  // Showing end tour in the header only when the welcome screen is shown
  if (showingWelcomeScreen) {
    return (
      <EndTourText
        onClick={() => {
          AnalyticsUtil.logEvent("END_ONBOARDING");
          dispatch(endOnboarding());
        }}
      >
        End Tour
      </EndTourText>
    );
  }

  return null;
}

export default EndTour;
