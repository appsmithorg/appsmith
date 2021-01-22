import { endOnboarding } from "actions/onboardingActions";
import React from "react";
import { useDispatch } from "react-redux";
import { useSelector } from "store";
import styled from "styled-components";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 37px;
  left: 37px;
  z-index: 8;
  padding: 12px;
  background-color: white;
  border: 2px solid #df613c;
  width: 303px;
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 131px;
  background-color: grey;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 12px;
  color: #000000;
`;

const Description = styled.div`
  font-size: 14px;
  margin-top: 12px;
  color: #000000;
`;

const Button = styled.button`
  padding: 6px 16px;
  cursor: pointer;
  border: none;
`;

const SkipButton = styled(Button)`
  background-color: transparent;
  font-size: 14px;
  color: #6d6d6d;
`;

const LetsGo = styled(Button)`
  background-color: #df613c;
  font-size: 14px;
  color: white;
`;

const Helper = () => {
  const showHelper = useSelector((state) => state.ui.onBoarding.showHelper);
  const helperConfig = useSelector(
    (state) => state.ui.onBoarding.helperStepConfig,
  );
  const dispatch = useDispatch();

  if (!showHelper) return null;

  return (
    <StyledContainer>
      <ImagePlaceholder />
      <Title>{helperConfig.title}</Title>
      <Description>{helperConfig.description}</Description>
      <div
        style={{
          marginTop: 9,
          justifyContent: "flex-end",
          display: "flex",
          flex: 1,
        }}
      >
        {helperConfig.skipLabel && (
          <SkipButton
            onClick={() => {
              dispatch(endOnboarding());
            }}
          >
            {helperConfig.skipLabel}
          </SkipButton>
        )}
        <LetsGo>{helperConfig.action?.label}</LetsGo>
      </div>
    </StyledContainer>
  );
};

export default Helper;
