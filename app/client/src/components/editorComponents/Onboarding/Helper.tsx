import { Classes, Icon } from "@blueprintjs/core";
import { endOnboarding } from "actions/onboardingActions";
import { Colors } from "constants/Colors";
import React, { MutableRefObject, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "reducers";
import styled from "styled-components";
import useClipboard from "utils/hooks/useClipboard";
import TickIcon from "assets/images/tick.svg";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { OnboardingStep } from "constants/OnboardingConstants";
import { CloseButton } from "components/designSystems/appsmith/CloseButton";
import { getIsOnboardingHelperVisible } from "selectors/onboardingSelectors";
import { Layers } from "constants/Layers";
import { getTypographyByKey } from "constants/DefaultTheme";
import {
  createMessage,
  WELCOME_TOUR_STICKY_BUTTON_TEXT,
} from "../../../constants/messages";

const StyledContainer = styled.div`
  position: fixed;
  bottom: 37px;
  left: 33px;
  z-index: 8;
  padding: 12px;
  background-color: white;
  border: 2px solid #df613c;
  width: 310px;

  & > .t--close--button {
    top: 3px;
    border-radius: 16px;
  }
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

const HintDescription = styled(Description)`
  margin-top: 9px;
  color: #000000;
  font-size: 12px;
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
  &:hover {
    color: ${Colors.GREY_10};
  }
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
  margin-right: 4px;
`;

const CheatActionButton = styled(Button)`
  background-color: #ffffff;
  border: 1px solid #716e6e;
  color: #716e6e;
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

  .bottomcontainer-steppercontainer {
    display: flex;
  }
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

const SubStepCount = styled.div<{ done: boolean }>`
  width: 17px;
  height: 17px;
  background-color: ${(props) => (props.done ? "#03B365" : "#6D6D6D")};
  border-radius: 50%;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  display: flex;

  .substepcount-value {
    font-size: 12px;
    color: white;
  }
`;

const SubStepContainer = styled.div`
  display: flex;
  margin-top: 10px;

  .substepcontainer-descriptioncontainer {
    margin-left: 7px;
  }
  .substepcontainer-description {
    color: #4b4848;
    font-size: 14px;
  }
`;

const SideStickBar = styled.div`
  position: fixed;
  bottom: 37px;
  left: 0;
  z-index: ${Layers.sideStickyBar};
  padding: ${(props) => props.theme.spaces[5]}px
    ${(props) => props.theme.spaces[3]}px;
  background-color: ${(props) =>
    props.theme.colors.welcomeTourStickySidebarBackground};
  color: ${(props) => props.theme.colors.welcomeTourStickySidebarColor};
  cursor: pointer;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  ${(props) => getTypographyByKey(props, "btnLarge")}
`;
const ActionButtonWrapper = styled.div`
  display: flex;
  flex-direction: row;
`;

function Helper() {
  const showHelper = useSelector(getIsOnboardingHelperVisible);
  const helperConfig = useSelector(
    (state: AppState) => state.ui.onBoarding.helperStepConfig,
  );
  const currentSubstep = useSelector(
    (state: AppState) => state.ui.onBoarding.currentSubstep,
  );
  const steps = Array.from({ length: OnboardingStep.FINISH }, (_, i) => i + 1);
  const [cheatMode, setCheatMode] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const dispatch = useDispatch();
  useEffect(() => {
    cheatMode && setCheatMode(false);
  }, [helperConfig]);
  const snippetRef: MutableRefObject<HTMLDivElement | null> = useRef(null);
  const write = useClipboard(snippetRef);

  const isClickedRef = useRef(false);

  const cheatActionOnClick = () => {
    if (isClickedRef.current) return;

    dispatch(helperConfig.cheatAction?.action);
    isClickedRef.current = true;
  };

  useEffect(() => {
    isClickedRef.current = false;
  }, [helperConfig.step]);

  if (!showHelper) return null;

  const copyBindingToClipboard = () => {
    helperConfig.hint?.snippet && write(helperConfig.hint.snippet);
  };

  return !minimized ? (
    <StyledContainer className="onboarding-step-indicator">
      {helperConfig.image ? (
        <MissionImage src={helperConfig.image.src} />
      ) : (
        <ImagePlaceholder />
      )}
      {helperConfig.step && <StepCount>Mission {helperConfig.step}</StepCount>}
      <Title className="t--onboarding-helper-title">{helperConfig.title}</Title>
      {helperConfig.allowMinimize && (
        <CloseButton
          className="t--close--button"
          color={Colors.BLACK_PEARL}
          onClick={() => setMinimized(true)}
          size={16}
        />
      )}
      <Description>{helperConfig.description}</Description>
      {helperConfig.subSteps &&
        helperConfig.subSteps.map((subStep, index) => {
          const subStepCount = index + 1;
          const done = currentSubstep > subStepCount;

          return (
            <SubStepContainer key={`substep-${index}`}>
              <SubStepCount done={done}>
                {done ? (
                  <img src={TickIcon} />
                ) : (
                  <span className="substepcount-value">{subStepCount}</span>
                )}
              </SubStepCount>
              <div className="substepcontainer-descriptioncontainer">
                <div className="substepcontainer-description">
                  {subStep.description}
                </div>
                {helperConfig.hint && cheatMode && (
                  <>
                    <HintDescription>
                      {helperConfig.hint.description}
                    </HintDescription>
                    <Snippet
                      className="t--onboarding-snippet"
                      onClick={copyBindingToClipboard}
                      ref={snippetRef}
                    >
                      <span>{helperConfig.hint?.snippet}</span>
                      <Icon
                        color={Colors.MINE_SHAFT}
                        icon="duplicate"
                        iconSize={14}
                      />
                    </Snippet>
                  </>
                )}
              </div>
            </SubStepContainer>
          );
        })}
      <BottomContainer>
        <div className="bottomcontainer-steppercontainer">
          {helperConfig.step &&
            steps.map((stepper) => {
              return (
                <Stepper
                  completed={
                    helperConfig.step ? helperConfig.step >= stepper : false
                  }
                  key={stepper}
                />
              );
            })}
        </div>
        <ActionButtonWrapper>
          {helperConfig.skipLabel && (
            <SkipButton
              onClick={() => {
                dispatch(endOnboarding());

                AnalyticsUtil.logEvent("ONBOARDING_SKIP_NOW");
              }}
            >
              {helperConfig.skipLabel}
            </SkipButton>
          )}
          {helperConfig.secondaryAction && (
            <SecondaryActionButton
              className="t--onboarding-secondary-action"
              onClick={() => dispatch(helperConfig.secondaryAction?.action)}
            >
              {helperConfig.secondaryAction.label}
            </SecondaryActionButton>
          )}
          {!cheatMode && helperConfig.action && (
            <ActionButton
              className="t--onboarding-action"
              initialStep={helperConfig.action.initialStep}
              onClick={() => {
                if (helperConfig.action && helperConfig.action.action) {
                  helperConfig.action.action(dispatch);
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
              className="t--onboarding-cheat-action"
              onClick={cheatActionOnClick}
            >
              {helperConfig.cheatAction?.label}
            </CheatActionButton>
          )}
        </ActionButtonWrapper>
      </BottomContainer>
    </StyledContainer>
  ) : (
    <SideStickBar
      className="t--side-sticky-bar"
      onClick={() => setMinimized(false)}
    >
      {createMessage(WELCOME_TOUR_STICKY_BUTTON_TEXT)}
    </SideStickBar>
  );
}

export default Helper;
