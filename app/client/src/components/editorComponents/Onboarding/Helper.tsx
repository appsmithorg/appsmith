import { Classes, Icon } from "@blueprintjs/core";
import { endOnboarding } from "actions/onboardingActions";
import { Colors } from "constants/Colors";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import useClipboard from "utils/hooks/useClipboard";

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
  margin-bottom: 6px;
  background-color: grey;
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
  white-space: pre-wrap;
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
  border: 1px solid ${(props) => (props.initialStep ? "#df613c" : "#457AE6")};
  margin-left: 8px;
`;

const SecondaryActionButton = styled(Button)`
  color: #4b4848;
  border: 1px solid #4b4848;
  font-weight: 500;
  background-color: transparent;
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

const Snippet = styled.div`
  background-color: #e5e5e5;
  color: white;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 8px 0px;
  margin-right: 20px;
  position: relative;
  color: ${Colors.MINE_SHAFT};
  cursor: pointer;
  & > span {
    padding: 6px;
  }
  & div.clipboard-message {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    z-index: 1;
    &.success {
      background: #e5e5e5;
    }
    &.error {
      background: ${Colors.RED};
    }
  }
  .${Classes.ICON} {
    opacity: 0.7;
  }
`;

const MissionImage = styled.img`
  width: 100%;
  height: 131px;
  margin-bottom: 6px;
  object-fit: contain;
`;

const Helper = () => {
  const showHelper = useSelector(
    (state: AppState) => state.ui.onBoarding.showHelper,
  );
  const helperConfig = useSelector(
    (state: AppState) => state.ui.onBoarding.helperStepConfig,
  );
  const steps = Array.from({ length: 6 }, (_, i) => i + 1);
  const [cheatMode, setCheatMode] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    cheatMode && setCheatMode(false);
  }, [helperConfig]);
  const snippetRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(snippetRef);

  if (!showHelper) return null;

  const copyBindingToClipboard = () => {
    helperConfig.snippet && write(helperConfig.snippet);
  };

  return (
    <StyledContainer>
      {helperConfig.image ? (
        <MissionImage src={helperConfig.image.src} />
      ) : (
        <ImagePlaceholder />
      )}

      {helperConfig.step && <StepCount>Mission {helperConfig.step}</StepCount>}
      <Title>{helperConfig.title}</Title>
      <Description>{helperConfig.description}</Description>
      {helperConfig.snippet && (
        <Snippet onClick={copyBindingToClipboard} ref={snippetRef}>
          <span>{helperConfig.snippet}</span>
          <Icon icon="duplicate" iconSize={14} color={Colors.MINE_SHAFT} />
        </Snippet>
      )}
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
          {helperConfig.secondaryAction && (
            <SecondaryActionButton
              onClick={helperConfig.secondaryAction.action}
            >
              {helperConfig.secondaryAction.label}
            </SecondaryActionButton>
          )}
          {!cheatMode && helperConfig.action && (
            <ActionButton
              initialStep={helperConfig.action.initialStep}
              onClick={() => {
                if (helperConfig.action && helperConfig.action.action) {
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
          {(cheatMode || !helperConfig.action) && (
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
