import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import pulseLight from "assets/lottie/pulse-light.json";
import pulseDark from "assets/lottie/pulse-dark.json";
import styled from "styled-components";
import { useSelector } from "store";

const IndicatorWrapper = styled.div<{ offset?: any }>`
  width: 90px;
  height: 90px;
  position: absolute;
  z-index: 0;

  // For centering
  top: 0;
  margin-top: auto;
  bottom: ${(props) => props.offset?.bottom ?? 0}px;
  margin-bottom: auto;
  left: ${(props) => props.offset?.left ?? 0}px;
  margin-left: auto;
  right: 0;
  margin-right: auto;

  // Increasing specificity and setting sibling element's position to relative
  && {
    & + * {
      position: relative;
    }
  }
`;

const Wrapper = styled.div`
  position: relative;

  @keyframes TransitioningBackground {
    0% {
      background-position: 1% 0%;
    }
    50% {
      background-position: 99% 100%;
    }
    100% {
      background-position: 1% 0%;
    }
  }

  @keyframes ShineTransition {
    0% {
      transform: translateX(-100px) skewX(-15deg);
    }
    100% {
      transform: translateX(300px) skewX(-15deg);
    }
  }

  & button {
    position: relative;
    background-image: (linear-gradient(270deg, #8e9ac2, #42579a));
    background-size: 400% 400%;
    animation: TransitioningBackground 5s ease infinite;
    // to ease the button growth on hover
    transition: 0.6s;
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
    animation: ShineTransition 1s ease infinite;
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
    animation: ShineTransition 1s ease infinite;
  }
`;

const Indicator = (props: any) => {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const showingIndicator = useSelector(
    (state) => state.ui.onBoarding.showingIndicator,
  );

  useEffect(() => {
    if (indicatorRef) {
      const animationData = props.theme === "light" ? pulseLight : pulseDark;

      lottie.loadAnimation({
        container: indicatorRef.current as Element,
        animationData: animationData,
        loop: true,
        autoplay: true,
      });
    }
  }, [indicatorRef, showingIndicator, props.theme]);

  if (showingIndicator === props.step) {
    return (
      <Wrapper className="t--onboarding-indicator">
        <IndicatorWrapper ref={indicatorRef} offset={props.offset} />
        {props.children}
      </Wrapper>
    );
  }

  return props.children;
};

export default Indicator;
