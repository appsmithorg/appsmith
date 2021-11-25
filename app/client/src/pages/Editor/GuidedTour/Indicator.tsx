import React, { useEffect, useRef } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import { useSelector } from "react-redux";
import {
  getCurrentStep,
  getIndicatorLocation,
  inGuidedTour,
} from "selectors/onboardingSelectors";
import styled from "styled-components";
import lottie, { AnimationItem } from "lottie-web";
import indicator from "assets/lottie/guided-tour-indicator.json";
import { PopoverPosition } from "@blueprintjs/core";

const IndicatorWrapper = styled.div<{ direction: Direction }>`
  height: 55px;
  width: 55px;
  svg {
    path {
      fill: white;
      fill-opacity: 1;
    }
  }
  background-color: transparent;
  ${(props) => {
    if (props.direction === "left") {
      return `transform: rotate(-90deg) scaleX(-1);`;
    } else if (props.direction === "right") {
      return `transform: rotate(90deg);`;
    } else if (props.direction === "down") {
      return `transform: rotate(-180deg);`;
    }
  }}
`;

type Direction = "down" | "right" | "left";

export type IndicatorLocation =
  | "RUN_QUERY"
  | "PROPERTY_PANE"
  | "WIDGET_SIDEBAR"
  | "NONE";

type IndicatorProps = {
  children: JSX.Element;
  show?: boolean;
  step: number;
  position?: PopoverPosition;
  direction: Direction;
  location?: IndicatorLocation;
  targetTagName?: keyof JSX.IntrinsicElements;
  async?: boolean;
};

function Indicator(props: IndicatorProps): JSX.Element {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentStep = useSelector(getCurrentStep);
  const indicatorLocation = useSelector(getIndicatorLocation);
  const showIndicator =
    props.show &&
    guidedTourEnabled &&
    currentStep === props.step &&
    props.location === indicatorLocation &&
    props.location !== "NONE";

  let anim: AnimationItem | undefined;

  const loadAnimation = () => {
    anim = lottie.loadAnimation({
      animationData: indicator,
      autoplay: true,
      container: indicatorRef?.current as HTMLDivElement,
      renderer: "svg",
      loop: true,
    });
  };

  useEffect(() => {
    if (showIndicator) {
      if (props.async) {
        setTimeout(() => {
          loadAnimation();
        }, 0);
      } else {
        loadAnimation();
      }
    }
    return () => {
      anim?.destroy();
    };
  }, [indicatorRef?.current, showIndicator, props.async]);

  if (showIndicator)
    return (
      <Popover2
        autoFocus={false}
        content={
          <IndicatorWrapper direction={props.direction} ref={indicatorRef} />
        }
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
