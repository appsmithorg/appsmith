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
