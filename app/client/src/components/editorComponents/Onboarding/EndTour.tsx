import { endOnboarding } from "actions/onboardingActions";
import React from "react";
import { useDispatch } from "react-redux";
import { showWelcomeScreen } from "selectors/onboardingSelectors";
import { useSelector } from "store";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Colors } from "constants/Colors";

const EndTourText = styled.span`
  font-size: 12px;
  color: ${Colors.CHARCOAL};
  align-self: center;
  cursor: pointer;
  margin-right: 4px;

  &:hover {
    color: ${Colors.GREY_10};
  }
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
