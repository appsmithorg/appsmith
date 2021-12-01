import React, { useEffect, useRef } from "react";
import { IPopover2Props, Popover2 } from "@blueprintjs/popover2";
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

const IndicatorWrapper = styled.div`
  height: 60px;
  width: 80px;
`;

export type IndicatorLocation =
  | "RUN_QUERY"
  | "PROPERTY_PANE"
  | "QUERY_EDITOR"
  | "WIDGET_SIDEBAR"
  | "NONE"
  | "PROPERTY_CONTROL"
  | "ACTION_CREATOR";

type IndicatorProps = {
  children?: JSX.Element;
  show?: boolean;
  step: number;
  position?: PopoverPosition;
  location?: IndicatorLocation;
  targetTagName?: keyof JSX.IntrinsicElements;
  async?: boolean;
  hideOnClick?: boolean;
  modifiers?: IPopover2Props["modifiers"];
};

function Indicator(props: IndicatorProps): JSX.Element | null {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const guidedTourEnabled = useSelector(inGuidedTour);
  const currentStep = useSelector(getCurrentStep);
  const indicatorLocation = useSelector(getIndicatorLocation);
  const showIndicator =
    props.show &&
    guidedTourEnabled &&
    currentStep === props.step &&
    (props.location ? props.location === indicatorLocation : true);
  let anim: AnimationItem | undefined;
  let popoverRef: Popover2<any> | null = null;

  useEffect(() => {
    setTimeout(() => {
      if (popoverRef !== null) {
        popoverRef.reposition();
      }
    }, 1000);
  }, [props.step]);

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
        content={<IndicatorWrapper ref={indicatorRef} />}
        enforceFocus={false}
        isOpen={props.show}
        lazy={false}
        minimal
        modifiers={props.modifiers}
        popoverClassName={`guided-tour-indicator`}
        position={props.position}
        ref={(ref) => (popoverRef = ref)}
        targetTagName={props.targetTagName}
      >
        {props.children}
      </Popover2>
    );

  return props?.children ?? null;
}

Indicator.defaultProps = {
  direction: "top",
  show: true,
  targetTagName: "span",
};

export default Indicator;
