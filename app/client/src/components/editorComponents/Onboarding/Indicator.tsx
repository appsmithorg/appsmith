import React, { ReactNode } from "react";
import styled from "styled-components";
import { useSelector } from "store";
import { OnboardingStep } from "constants/OnboardingConstants";

const Wrapper = styled.div`
  position: relative;

  @keyframes ShineTransition {
    0% {
      transform: translateX(-100px) skewX(-15deg);
    }
    100% {
      transform: translateX(250px) skewX(-15deg);
    }
  }

  & button {
    position: relative;
    background-size: 400% 400%;
    overflow: hidden;
  }

  // psuedo-element shine animation left side
  & button::before {
    content: "";
    display: block;
    position: absolute;
    background: rgba(255, 255, 255, 0.5);
    width: 60px;
    height: 100%;
    top: 0;
    filter: blur(30px);
    animation: ShineTransition 1.3s ease infinite;
  }

  // psuedo-element shine animation right side
  & button::after {
    content: "";
    display: block;
    position: absolute;
    background: rgba(255, 255, 255, 0.2);
    width: 30px;
    height: 100%;
    top: 0;
    filter: blur(5px);
    animation: ShineTransition 1.3s ease infinite;
  }
`;

type IndicatorProps = {
  step: OnboardingStep;
  // Any conditions
  show?: boolean;
  children: ReactNode;
};

const Indicator: React.FC<IndicatorProps> = (props: IndicatorProps) => {
  const showingIndicator = useSelector(
    (state) => state.ui.onBoarding.showingIndicator,
  );

  if (showingIndicator === props.step && props.show) {
    return (
      <Wrapper className="t--onboarding-indicator">{props.children}</Wrapper>
    );
  }

  return <>{props.children}</>;
};

Indicator.defaultProps = {
  show: true,
};

export default Indicator;
