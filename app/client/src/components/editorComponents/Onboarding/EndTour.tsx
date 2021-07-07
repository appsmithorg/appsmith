import { endOnboarding } from "actions/onboardingActions";
import React from "react";
import { useDispatch } from "react-redux";
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

export default EndTour;
