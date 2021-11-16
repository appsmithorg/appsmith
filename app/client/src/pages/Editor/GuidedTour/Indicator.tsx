import React, { ReactNode, useEffect, useRef } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import { useSelector } from "react-redux";
import {
  getCurrentStep,
  getIndicatorLocation,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import styled from "styled-components";
import lottie from "lottie-web";
import indicator from "assets/lottie/guided-tour-indicator.json";
import { PopoverPosition } from "@blueprintjs/core";

const IndicatorWrapper = styled.div<{ direction: Direction }>`
  height: 55px;
  width: 55px;
  background-color: transparent;
  ${(props) => {
    if (props.direction === "left") {
      return `transform: rotate(-90deg);`;
    } else if (props.direction === "right") {
      return `transform: rotate(90deg);`;
    } else if (props.direction === "down") {
      return `transform: rotate(-180deg);`;
    }
  }}
`;

type Direction = "down" | "right" | "left";

type Location = "RUN_QUERY";

type IndicatorProps = {
  children: JSX.Element;
  show?: boolean;
  step: number;
  position?: PopoverPosition;
  direction: Direction;
  location?: Location;
  targetTagName?: keyof JSX.IntrinsicElements;
};

function Indicator(props: IndicatorProps): JSX.Element {
  const dotRef = useRef<HTMLDivElement>(null);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentStep = useSelector(getCurrentStep);
  const indicatorLocation = useSelector(getIndicatorLocation);
  const showIndicator =
    props.show &&
    guidedTourEnabled &&
    currentStep === props.step &&
    props.location === indicatorLocation;

  useEffect(() => {
    if (showIndicator) {
      const anim = lottie.loadAnimation({
        animationData: indicator,
        autoplay: true,
        container: dotRef?.current as HTMLDivElement,
        renderer: "svg",
        loop: true,
      });
      return () => {
        anim?.destroy();
      };
    }
  }, [dotRef?.current, showIndicator]);

  if (showIndicator)
    return (
      <Popover2
        autoFocus={false}
        content={<IndicatorWrapper direction={props.direction} ref={dotRef} />}
        enforceFocus={false}
        isOpen={props.show}
        minimal
        popoverClassName="guided-tour-indicator"
        position={props.position}
        targetTagName={props.targetTagName}
      >
        {props.children}
      </Popover2>
    );

  return props.children;
}

Indicator.defaultProps = {
  direction: "top",
  show: true,
  targetTagName: "span",
};

export default Indicator;
