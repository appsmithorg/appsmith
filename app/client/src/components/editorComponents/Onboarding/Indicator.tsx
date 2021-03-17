import React, { ReactNode } from "react";
import styled from "styled-components";
import { useSelector } from "store";
import { OnboardingStep } from "constants/OnboardingConstants";

const Wrapper = styled.div<{ width: number; hasButton?: boolean }>`
  position: relative;

  @keyframes ShineTransition {
    0% {
      transform: translateX(-100px) skewX(-15deg);
    }
    100% {
      transform: ${(props) => `translateX(${props.width}px) skewX(-15deg)`};
    }
  }

  & ${(props) => (props.hasButton ? "button" : "*")} {
    position: relative;
    background-size: 400% 400%;
    overflow: hidden;
  }

  // psuedo-element shine animation left side
  & ${(props) => (props.hasButton ? "button" : "*")}::before {
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
  & ${(props) => (props.hasButton ? "button" : "*")}::after {
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

  // Overiding certain values specifically for widget menu
  &.onboarding-widget-menu {
    @keyframes ShineTransition {
      0% {
        transform: translateX(-100px) skewX(-20deg);
      }
      100% {
        transform: ${(props) => `translateX(${props.width}px) skewX(-30deg)`};
      }
    }

    & ${(props) => (props.hasButton ? "button" : "*")}::before {
      background: rgba(255, 255, 255, 0.7);
      width: 20px;
      filter: blur(25px);
      animation: ShineTransition 1.2s ease infinite;
    }

    // psuedo-element shine animation right side
    & ${(props) => (props.hasButton ? "button" : "*")}::after {
      background: rgba(255, 255, 255, 0.4);
      width: 20px;
      animation: ShineTransition 1.2s ease infinite;
    }
  }
`;

type IndicatorProps = {
  step: OnboardingStep;
  // Any conditions
  show?: boolean;
  // Animate to x position.
  width?: number;
  // Is wrapped around a button
  hasButton?: boolean;
  children: ReactNode;
  className?: string;
};

const Indicator: React.FC<IndicatorProps> = (props: IndicatorProps) => {
  const showingIndicator = useSelector(
    (state) => state.ui.onBoarding.showingIndicator,
  );

  if (showingIndicator === props.step && props.show) {
    return (
      <Wrapper
        hasButton={props.hasButton}
        width={props.width || 250}
        className={`t--onboarding-indicator ${props.className}`}
      >
        {props.children}
      </Wrapper>
    );
  }

  return <>{props.children}</>;
};

Indicator.defaultProps = {
  show: true,
  hasButton: true,
};

export default Indicator;
