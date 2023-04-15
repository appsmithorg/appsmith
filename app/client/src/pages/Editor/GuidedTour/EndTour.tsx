import { enableGuidedTour } from "actions/onboardingActions";
// import { getTypographyByKey } from "design-system-old";
import { createMessage, END_TUTORIAL } from "@appsmith/constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
// import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Button } from "design-system";

function EndTour() {
  const dispatch = useDispatch();
  const endTour = () => {
    dispatch(enableGuidedTour(false));
    AnalyticsUtil.logEvent("END_GUIDED_TOUR_CLICK");
  };

  return (
    <Button kind="tertiary" onClick={endTour} size="sm">
      {createMessage(END_TUTORIAL)}
    </Button>
  );
}

export default EndTour;
