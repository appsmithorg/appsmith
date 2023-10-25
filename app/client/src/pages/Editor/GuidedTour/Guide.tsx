import {
  setUpTourApp,
  showInfoMessage,
  toggleLoader,
} from "actions/onboardingActions";
import { Button, Icon, Text } from "design-system";
import { isArray } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import lazyLottie from "utils/lazyLottie";
import tickMarkAnimationURL from "assets/lottie/guided-tour-tick-mark.json.txt";
import {
  getCurrentStep,
  getQueryAction,
  isExploringSelector,
  loading,
  showInfoMessageSelector,
  showSuccessMessage,
} from "selectors/onboardingSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { GUIDED_TOUR_STEPS, Steps } from "./constants";
import useComputeCurrentStep from "./useComputeCurrentStep";
import {
  BUTTON_TEXT,
  COMPLETE,
  CONTINUE,
  createMessage,
  DESCRIPTION,
  PROCEED,
  PROCEED_TO_NEXT_STEP,
  TITLE,
} from "@appsmith/constants/messages";

const GuideWrapper = styled.div`
  user-select: text;
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border-bottom: 1px solid var(--ads-v2-color-border);
  flex-direction: column;
  background: var(--ads-v2-color-bg-information);
`;

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
`;

const StepCount = styled.div`
  background: var(--ads-v2-color-bg-emphasis-max);
  color: var(--ads-v2-color-fg-on-emphasis-plus);
  height: 24px;
  width: 24px;
  border-radius: var(--ads-v2-border-radius-circle);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--ads-v2-spaces-3);
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 14px;
  line-height: 16px;

  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0")};
  margin-top: var(--ads-v2-spaces-2);
`;

const UpperContent = styled.div`
  padding: var(--ads-v2-spaces-5);
  flex-direction: column;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 50px;
  align-items: center;
  .guided-title {
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

const GuideButton = styled(Button)<{ isVisible?: boolean }>`
  visibility: ${({ isVisible = true }) => (isVisible ? "visible" : "hidden")};
`;

const SubContentWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-direction: row;
  }
  .count {
    font-size: 12px;
    font-weight: 600;
    text-align: center;

    .complete {
      font-weight: 400;
    }
  }
`;

const Hint = styled.div`
  background: var(--ads-v2-color-bg);
  padding: var(--ads-v2-spaces-4);
  margin-top: var(--ads-v2-spaces-5);
  display: flex;
  align-items: center;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);

  .align-vertical {
    flex-direction: column;
  }

  .inner-wrapper {
    flex: 1;
  }

  .hint-text {
    font-size: 14px;
  }

  .hint-button {
    margin-top: ${(props) => props.theme.spaces[6]}px;
  }

  .hint-steps {
    display: flex;
    margin-top: ${(props) => props.theme.spaces[5]}px;
  }

  .strike {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .hint-steps-text {
    margin-left: ${(props) => props.theme.spaces[4]}px;
  }
`;

const HintTextWrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;

  img {
    height: 70px;
    width: 152px;
  }
`;

const SuccessMessageWrapper = styled.div`
  display: flex;
  background: var(--ads-v2-color-bg);
  flex-direction: column;
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);

  .wrapper {
    padding: var(--ads-v2-spaces-4);
    display: flex;
  }
  .info-wrapper {
    padding: var(--ads-v2-spaces-4);
    align-items: center;
  }

  .lottie-wrapper {
    height: 40px;
    width: 40px;
  }
  .title-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }
  .success-message {
    color: var(--ads-v2-color-fg-emphasis);
  }
`;

function InitialContent() {
  const dispatch = useDispatch();
  const isLoading = useSelector(loading);
  const queryAction = useSelector(getQueryAction);

  const setupFirstStep = () => {
    dispatch(toggleLoader(true));
    dispatch(setUpTourApp());
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Text className="guided-title" kind="heading-s" renderAs="h2">
            {createMessage(TITLE)}
          </Text>
          <Description>{createMessage(DESCRIPTION)}</Description>
        </SubContentWrapper>
        <GuideButton
          className="t--start-building"
          isLoading={isLoading}
          isVisible={!queryAction?.isLoading && !!queryAction?.data}
          onClick={setupFirstStep}
          size="md"
        >
          {createMessage(BUTTON_TEXT)}
        </GuideButton>
      </ContentWrapper>
      <Hint>
        <span className="hint-text">
          The app is connected to a Postgres database with customers data called{" "}
          <b>Customers DB</b>.
        </span>
      </Hint>
    </div>
  );
}

function GuideStepsContent(props: {
  currentStep: number;
  showInfoMessage: boolean;
}) {
  const meta = useComputeCurrentStep(props.showInfoMessage);
  const content = Steps[props.currentStep];
  const [hintCount, setHintCount] = useState(0);
  const currentHint = content.hints[hintCount]
    ? content.hints[hintCount]
    : content.hints[0];
  const dispatch = useDispatch();

  useEffect(() => {
    setHintCount(0);
  }, [props.currentStep]);

  useEffect(() => {
    setHintCount(meta.hintCount);
  }, [meta.hintCount]);

  const hintSteps = currentHint.steps;

  const hintButtonOnClick = () => {
    if (currentHint.button && currentHint.button.onClick) {
      currentHint.button.onClick(dispatch);
    }
    setHintCount((count) => count + 1);
  };

  return (
    <div data-testid={"guided-tour-banner"}>
      <ContentWrapper>
        <SubContentWrapper>
          <div className="header">
            <TitleWrapper>
              <StepCount>{props.currentStep}</StepCount>
              <Text className="guided-title" kind="heading-s" renderAs="h2">
                {content.title}
              </Text>
            </TitleWrapper>
            <div className="count">
              {props.currentStep - 1}/{GUIDED_TOUR_STEPS.DEPLOY}
              {"  "}
              <span className="complete">{createMessage(COMPLETE)}</span>
            </div>
          </div>
          {content.description && (
            <Description>{content.description}</Description>
          )}
        </SubContentWrapper>
      </ContentWrapper>
      <Hint>
        <div className="inner-wrapper hint-text">
          <HintTextWrapper>
            <div>{currentHint.text}</div>
            {currentHint.image && <img src={currentHint.image} />}
            {currentHint.button && (
              <GuideButton
                className="t--hint-button"
                onClick={hintButtonOnClick}
                size="md"
              >
                {createMessage(PROCEED)}
              </GuideButton>
            )}
          </HintTextWrapper>
          {isArray(hintSteps) &&
            hintSteps.length &&
            hintSteps.map((step, index) => {
              const completed = meta.completedSubSteps.includes(index);
              const className = "hint-steps" + (completed ? " strike" : "");

              return (
                <div className={className} key={step?.toString()}>
                  <Icon
                    color={
                      completed ? "var(--ads-v2-color-fg-success)" : "inherit"
                    }
                    name={completed ? "oval-check-fill" : "oval-check"}
                    size="md"
                  />
                  <span className="hint-steps-text">{hintSteps[index]}</span>
                </div>
              );
            })}
        </div>
      </Hint>
    </div>
  );
}

interface CompletionContentProps {
  step: number;
  showInfoMessage: boolean;
}

function CompletionContent(props: CompletionContentProps) {
  const [showSuccess, setShowSuccess] = useState(!props.showInfoMessage);
  const [showSuccessButton, setShowSuccessButton] = useState(false);
  const info = Steps[props.step].info;
  const success = Steps[props.step].success;
  const dispatch = useDispatch();

  const tickMarkRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (showSuccess) {
      const anim = lazyLottie.loadAnimation({
        path: tickMarkAnimationURL,
        autoplay: true,
        container: tickMarkRef?.current as HTMLDivElement,
        renderer: "svg",
        loop: false,
      });

      return () => {
        anim.destroy();
      };
    }
  }, [tickMarkRef?.current, showSuccess]);

  const onSuccessButtonClick = () => {
    setShowSuccess(false);
    success?.onClick && success?.onClick(dispatch);

    if (info) {
      // We skip showing success message again
      dispatch(showInfoMessage());
    }
  };

  useEffect(() => {
    if (success?.timed && showSuccess) {
      setTimeout(() => {
        setShowSuccessButton(true);
      }, 2000);
    }
  }, [success?.timed, showSuccess]);

  const onInfoButtonClick = () => {
    info?.onClick(dispatch);
  };

  if (showSuccess) {
    return (
      <SuccessMessageWrapper>
        <div className="wrapper">
          <div className="lottie-wrapper" ref={tickMarkRef} />
          <div className="title-wrapper">
            <Text className="success-message" kind="heading-s" renderAs="h2">
              {Steps[props.step].success?.text}
            </Text>
            {/* Show the button after a delay */}
            <GuideButton
              className="t--success-button"
              isVisible={showSuccessButton}
              onClick={onSuccessButtonClick}
              size="md"
            >
              {success?.buttonText ?? createMessage(CONTINUE)}
            </GuideButton>
          </div>
        </div>
      </SuccessMessageWrapper>
    );
  } else {
    return (
      <SuccessMessageWrapper>
        <div className="wrapper info-wrapper">
          {info?.icon && (
            <Icon
              color="var(--ads-v2-color-fg-information)"
              name={info.icon}
              size="lg"
            />
          )}
          <Description className="info">{info?.text}</Description>
          <GuideButton
            className="t--info-button"
            onClick={onInfoButtonClick}
            size="md"
          >
            {info?.buttonText ?? createMessage(PROCEED_TO_NEXT_STEP)}
          </GuideButton>
        </div>
      </SuccessMessageWrapper>
    );
  }
}

export interface GuideBody {
  exploring: boolean;
  step: number;
  showInfoMessage: boolean;
}

function GuideBody(props: GuideBody) {
  const successMessage = useSelector(showSuccessMessage);

  if (props.exploring) {
    return <InitialContent />;
  } else if (successMessage || props.showInfoMessage) {
    return (
      <CompletionContent
        showInfoMessage={props.showInfoMessage}
        step={props.step}
      />
    );
  } else {
    return (
      <GuideStepsContent
        currentStep={props.step}
        showInfoMessage={props.showInfoMessage}
      />
    );
  }
}

interface GuideProps {
  className?: string;
}
// Guided tour steps
function Guide(props: GuideProps) {
  const exploring = useSelector(isExploringSelector);
  const step = useSelector(getCurrentStep);
  const showInfoMessage = useSelector(showInfoMessageSelector);

  return (
    <GuideWrapper className={props.className}>
      <CardWrapper>
        <UpperContent>
          <GuideBody
            exploring={exploring}
            showInfoMessage={showInfoMessage}
            step={step}
          />
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
