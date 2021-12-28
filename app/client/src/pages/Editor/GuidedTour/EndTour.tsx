import { enableGuidedTour } from "actions/onboardingActions";
import { createMessage, END_TUTORIAL } from "constants/messages";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const EndTutorial = styled.span`
  font-size: 12px;
  letter-spacing: 0.6px;
  color: #4b4848;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #928f8f;
  }
`;

function EndTour() {
  const dispatch = useDispatch();
  const endTour = () => {
    dispatch(enableGuidedTour(false));
  };

  return (
    <EndTutorial onClick={endTour}>{createMessage(END_TUTORIAL)}</EndTutorial>
  );
}

export default EndTour;
