import { endOnboarding } from "actions/onboardingActions";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";

const EndTourText = styled.span`
  font-size: 12px;
  color: #d8d8d8;
  align-self: flex-end;
  cursor: pointer;
`;

const EndTour = () => {
  const dispatch = useDispatch();

  return (
    <EndTourText onClick={() => dispatch(endOnboarding())}>
      End Tour
    </EndTourText>
  );
};

export default EndTour;
