import {
  setUpTourApp,
  showInfoMessage,
  toggleLoader,
} from "actions/onboardingActions";
import Button from "components/ads/Button";
import Icon, { IconSize } from "components/ads/Icon";
import { isArray } from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-tick-mark.json";
import {
  getCurrentStep,
  isExploringSelector,
  loading,
  showInfoMessageSelector,
  showSuccessMessage,
} from "selectors/onboardingSelectors";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Steps } from "./constants";
import useComputeCurrentStep from "./useComputeCurrentStep";

const GuideWrapper = styled.div`
  margin-bottom: 10px;
  user-select: text;

  code {
    font-size: 16px;
  }
`;

const CardWrapper = styled.div`
  width: 100%;
  display: flex;
  border-bottom: 1px solid #eeeeee;
  flex-direction: column;
  background: #ffefdb;
`;

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
`;

const Title = styled.span`
  font-weight: 600;
  font-size: 18px;
  letter-spacing: -0.24px;
  line-height: 24px;
  color: #000000;
  display: flex;
  flex: 1;
`;

const StepCount = styled.div`
  background: #090707;
  color: white;
  ${(props) => getTypographyByKey(props, "h5")};
  height: 24px;
  width: 24px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const Description = styled.span<{ addLeftSpacing?: boolean }>`
  font-size: 16px;
  line-height: 19px;

  letter-spacing: -0.24px;
  padding-left: ${(props) => (props.addLeftSpacing ? `20px` : "0px")};
  margin-top: 9px;
  flex: 1;
  display: flex;
`;

const UpperContent = styled.div`
  padding: 20px 16px;
  flex-direction: column;
  display: flex;
`;

const ContentWrapper = styled.div`
  display: flex;
  gap: 50px;
  align-items: center;
`;

const GuideButton = styled(Button)<{ isVisible?: boolean }>`
  padding: ${(props) => props.theme.spaces[0]}px
    ${(props) => props.theme.spaces[6]}px;
  height: 38px;
  ${(props) => getTypographyByKey(props, "btnMedium")};
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
    font-size: 14px;
    font-weight: 600;
    width: 105px;
    text-align: center;

    .complete {
      font-weight: 400;
    }
  }
`;

const Hint = styled.div`
  background: #ffffff;
  padding: 19px 24px;
  margin-top: 20px;
  display: flex;
  align-items: center;
  border: 1px solid #716e6e;
  box-shadow: 0px 0px 24px -4px rgba(16, 24, 40, 0.1),
    0px 8px 8px -4px rgba(16, 24, 40, 0.04);

  .align-vertical {
    flex-direction: column;
  }

  .inner-wrapper {
    flex: 1;
  }

  .hint-text {
    font-size: 16px;
  }

  .hint-button {
    margin-top: 14px;
  }

  .hint-steps {
    display: flex;
    margin-top: 12px;
  }

  .strike {
    text-decoration: line-through;
    opacity: 0.5;
  }

  .hint-steps-text {
    margin-left: 10px;
  }
`;

const HintTextWrapper = styled.div`
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;

  img {
    height: 85px;
    width: 186px;
    box-shadow: 0px 4px 8px -2px rgba(16, 24, 40, 0.1),
      0px 2px 4px -2px rgba(16, 24, 40, 0.06);
  }
`;

const SuccessMessageWrapper = styled.div`
  display: flex;
  background: white;
  flex-direction: column;
  border: 1px solid #716e6e;
  box-shadow: 0px 0px 24px -4px rgba(16, 24, 40, 0.1),
    0px 8px 8px -4px rgba(16, 24, 40, 0.04);

  .wrapper {
    padding: 6px 24px;
    display: flex;
  }
  .info-wrapper {
    padding: 26px 36px;
    align-items: center;

    svg {
      height: 40px;
      width: 40px;
    }
  }

  .lottie-wrapper {
    height: 59px;
    weight: 59px;
  }
  .title-wrapper {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-between;
  }
  .info {
    padding-left: 15px;
    display: block;
    padding-right: 65px;
    margin-top: 0px;
    line-height: 24px;
    font-size: 18px;
  }
`;

function InitialContent() {
  const dispatch = useDispatch();
  const isLoading = useSelector(loading);

  const setupFirstStep = () => {
    dispatch(toggleLoader(true));
    dispatch(setUpTourApp());
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <Title>
            In this tutorial we’ll build a tool to display customer information
          </Title>
          <Description>
            This tool has a table that displays customer data and a form to
            update a particular customer record. Try out the tool below before
            you start building this.
          </Description>
        </SubContentWrapper>
        <GuideButton
          isLoading={isLoading}
          onClick={setupFirstStep}
          tag="button"
          text="Start Building"
        />
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
  meta: GuideBody["meta"];
}) {
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
    setHintCount(props.meta.hintCount);
  }, [props.meta.hintCount]);

  const hintSteps = currentHint.steps;

  const hintButtonOnClick = () => {
    if (currentHint.button && currentHint.button.onClick) {
      currentHint.button.onClick(dispatch);
    }
    setHintCount((count) => count + 1);
  };

  return (
    <div>
      <ContentWrapper>
        <SubContentWrapper>
          <div className="header">
            <TitleWrapper>
              <StepCount>{props.currentStep}</StepCount>
              <Title>{content.title}</Title>
            </TitleWrapper>
            <div className="count">
              {props.currentStep - 1}/9{" "}
              <span className="complete">COMPLETE</span>
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
                onClick={hintButtonOnClick}
                tag="button"
                text={"PROCEED"}
              />
            )}
          </HintTextWrapper>
          {isArray(hintSteps) &&
            hintSteps.length &&
            hintSteps.map((step, index) => {
              const completed = props.meta.completedSubSteps.includes(index);
              const className = "hint-steps" + (completed ? " strike" : "");

              return (
                <div className={className} key={step?.toString()}>
                  <Icon
                    fillColor={completed ? "#03B365" : "#716E6E"}
                    name={completed ? "oval-check-fill" : "oval-check"}
                    size={IconSize.XXL}
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

type CompletionContentProps = {
  step: number;
  showInfoMessage: boolean;
};

function CompletionContent(props: CompletionContentProps) {
  const [showSuccess, setShowSuccess] = useState(!props.showInfoMessage);
  const [showSuccessButton, setShowSuccessButton] = useState(false);
  const info = Steps[props.step].info;
  const success = Steps[props.step].success;
  const dispatch = useDispatch();

  const tickMarkRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: AnimationItem;
    if (showSuccess) {
      anim = lottie.loadAnimation({
        animationData: indicator,
        autoplay: true,
        container: tickMarkRef?.current as HTMLDivElement,
        renderer: "svg",
        loop: false,
      });
    }

    return () => {
      anim?.destroy();
    };
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
            <Title>{Steps[props.step].success?.text}</Title>
            {/* Show the button after a delay */}
            <GuideButton
              isVisible={showSuccessButton}
              onClick={onSuccessButtonClick}
              tag="button"
              text={success?.buttonText ?? "CONTINUE"}
            />
          </div>
        </div>
      </SuccessMessageWrapper>
    );
  } else {
    return (
      <SuccessMessageWrapper>
        <div className="wrapper info-wrapper">
          <Icon fillColor="#F86A2B" name={info?.icon} size={IconSize.XXXXL} />

          <Description className="info">{info?.text}</Description>
          <GuideButton
            onClick={onInfoButtonClick}
            tag="button"
            text={info?.buttonText ?? "PROCEED TO NEXT STEP"}
          />
        </div>
      </SuccessMessageWrapper>
    );
  }
}

export type GuideBody = {
  exploring: boolean;
  step: number;
  meta: {
    completedSubSteps: number[];
    hintCount: number;
  };
  showInfoMessage: boolean;
};

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
    return <GuideStepsContent currentStep={props.step} meta={props.meta} />;
  }
}

type GuideProps = {
  className?: string;
};
// Guided tour steps
function Guide(props: GuideProps) {
  const exploring = useSelector(isExploringSelector);
  const step = useSelector(getCurrentStep);
  const showInfoMessage = useSelector(showInfoMessageSelector);
  const meta = useComputeCurrentStep(exploring, showInfoMessage);

  return (
    <GuideWrapper className={props.className}>
      <CardWrapper>
        <UpperContent>
          <GuideBody
            exploring={exploring}
            meta={meta}
            showInfoMessage={showInfoMessage}
            step={step}
          />
        </UpperContent>
      </CardWrapper>
    </GuideWrapper>
  );
}

export default Guide;
