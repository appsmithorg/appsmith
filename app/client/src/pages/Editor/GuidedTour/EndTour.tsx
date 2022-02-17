import { enableGuidedTour } from "actions/onboardingActions";
import { getTypographyByKey } from "constants/DefaultTheme";
import { createMessage, END_TUTORIAL } from "@appsmith/constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const EndTutorial = styled.span`
  color: ${(props) => props.theme.colors.guidedTour.endTourButton.color};
  ${(props) => getTypographyByKey(props, "btnMedium")}
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.colors.guidedTour.endTourButton.hoverColor};
  }
`;

function EndTour() {
  const dispatch = useDispatch();
  const endTour = () => {
    dispatch(enableGuidedTour(false));
    AnalyticsUtil.logEvent("END_GUIDED_TOUR_CLICK");
  };

  return (
    <EndTutorial onClick={endTour}>{createMessage(END_TUTORIAL)}</EndTutorial>
  );
}

export default EndTour;
