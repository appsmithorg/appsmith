import React, { useEffect, useRef } from "react";
import lottie from "lottie-web";
import pulse from "assets/lottie/pulse.json";
import styled from "styled-components";
import { useSelector } from "store";

const IndicatorWrapper = styled.div`
  width: 90px;
  height: 90px;
  position: absolute;
  z-index: 0;

  // For centering
  top: 0;
  margin-top: auto;
  bottom: 0;
  margin-bottom: auto;
  left: 0;
  margin-left: auto;
  right: 0;
  margin-right: auto;
`;

const Indicator = (props: any) => {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const showingIndicator = useSelector(
    state => state.ui.onBoarding.showingIndicator,
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
  }, [indicatorRef]);

  if (showingIndicator === props.step) {
    return (
      <div style={{ position: "relative" }}>
        <IndicatorWrapper ref={indicatorRef} />
        {props.children}
      </div>
    );
  }

  return props.children;
};

export default Indicator;
