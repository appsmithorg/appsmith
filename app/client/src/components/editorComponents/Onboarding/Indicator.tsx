import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import pulse from "assets/lottie/pulse.json";
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

const Indicator = (props: any) => {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const showingIndicator = useSelector(
    (state) => state.ui.onBoarding.showingIndicator,
  );

  useEffect(() => {
    if (indicatorRef) {
      lottie.loadAnimation({
        container: indicatorRef.current as Element,
        animationData: pulse,
        loop: true,
        autoplay: true,
      });
    }
  }, [indicatorRef, showingIndicator]);

  if (showingIndicator === props.step) {
    return (
      <div style={{ position: "relative" }} className="t--onboarding-indicator">
        <IndicatorWrapper ref={indicatorRef} offset={props.offset} />
        {props.children}
      </div>
    );
  }

  return props.children;
};

export default Indicator;
