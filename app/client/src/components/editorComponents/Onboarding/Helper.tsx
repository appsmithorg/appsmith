import { endOnboarding } from "actions/onboardingActions";
import React, { useEffect, useState } from "react";
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
  margin-bottom: 6px;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  margin-top: 6px;
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
  font-size: 14px;
`;

const SkipButton = styled(Button)`
  background-color: transparent;
  font-size: 14px;
  color: #6d6d6d;
`;

const ActionButton = styled(Button)<{ initialStep?: boolean }>`
  background-color: ${(props) => (props.initialStep ? "#df613c" : "#457AE6")};
  color: white;
  font-weight: 500;
`;

const CheatActionButton = styled(Button)`
  background-color: #ffffff;
  border: 1px solid #ed3049;
  color: #ed3049;
  font-weight: 500;
`;

const StepCount = styled.div`
  font-size: 12px;
  color: #6d6d6d;
  font-weight: 500;
  margin-top: 6px;
`;

const BottomContainer = styled.div`
  margin-top: 9px;
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
`;

const Stepper = styled.div<{ completed: boolean }>`
  width: 6px;
  height: 6px;
  border-radius: 3px;
  margin-right: 3px;
  background-color: ${(props) => (props.completed ? "#457AE6" : "#C4C4C4")};
`;

const Helper = () => {
  const showHelper = useSelector((state) => state.ui.onBoarding.showHelper);
  const helperConfig = useSelector(
    (state) => state.ui.onBoarding.helperStepConfig,
  );
  const steps = Array.from({ length: 6 }, (_, i) => i + 1);
  const [cheatMode, setCheatMode] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    cheatMode && setCheatMode(false);
  }, [helperConfig]);

  if (!showHelper) return null;

  return (
    <StyledContainer>
      <ImagePlaceholder />
      {helperConfig.step && <StepCount>STEP {helperConfig.step}</StepCount>}
      <Title>{helperConfig.title}</Title>
      <Description>{helperConfig.description}</Description>
      <BottomContainer>
        <div style={{ display: "flex" }}>
          {helperConfig.step &&
            steps.map((stepper) => {
              return (
                <Stepper
                  key={stepper}
                  completed={
                    helperConfig.step ? helperConfig.step >= stepper : false
                  }
                />
              );
            })}
        </div>
        <div>
          {helperConfig.skipLabel && (
            <SkipButton
              onClick={() => {
                dispatch(endOnboarding());
              }}
            >
              {helperConfig.skipLabel}
            </SkipButton>
          )}
          {!cheatMode && (
            <ActionButton
              initialStep={helperConfig.action.initialStep}
              onClick={() => {
                if (helperConfig.action.action) {
                  dispatch(helperConfig.action.action);
                }

                if (helperConfig.cheatAction) {
                  setCheatMode(true);
                }
              }}
            >
              {helperConfig.action?.label}
            </ActionButton>
          )}
          {cheatMode && (
            <CheatActionButton
              onClick={() => {
                dispatch(helperConfig.cheatAction?.action);
              }}
            >
              {helperConfig.cheatAction?.label}
            </CheatActionButton>
          )}
        </div>
      </BottomContainer>
    </StyledContainer>
  );
};

export default Helper;
