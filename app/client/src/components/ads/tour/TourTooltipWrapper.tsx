import React, { useEffect, useRef } from "react";
import TooltipComponent from "components/ads/Tooltip";
import { useSelector } from "react-redux";
import Text, { TextType } from "../Text";
import { Position } from "@blueprintjs/core";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { TourType } from "entities/Tour";
import TourStepsByType from "constants/TourSteps";
import { AppState } from "reducers";
import { noop } from "lodash";
import styled, { CSSProperties } from "styled-components";
import { Modifiers } from "popper.js";
import lottie from "lottie-web";
import pulsatingDot from "assets/lottie/pulse-dot.json";

type Props = {
  children: React.ReactNode;
  hasOverlay?: boolean;
  tourType: TourType;
  tourIndex: number;
  modifiers?: Modifiers;
  onClick?: () => void;
  pulseStyles?: CSSProperties;
  showPulse?: boolean;
};

const Overlay = styled.div`
  background-color: #090707cc;
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  position: fixed;
`;

function TourTooltipWrapper(props: Props) {
  const { children, tourIndex, tourType } = props;
  const isCurrentStepActive = useSelector(
    (state: AppState) => getActiveTourIndex(state) === tourIndex,
  );
  const isCurrentTourActive = useSelector(
    (state: AppState) => getActiveTourType(state) === tourType,
  );
  const tourStepsConfig = TourStepsByType[tourType as TourType];
  const tourStepConfig = tourStepsConfig[tourIndex];
  const isOpen = isCurrentStepActive && isCurrentTourActive;
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      animationData: pulsatingDot,
      autoplay: true,
      container: dotRef?.current as HTMLDivElement, // the dom element that will contain the animation
      renderer: "svg",
      loop: true,
    });

    return () => {
      anim?.destroy();
    };
  }, [isOpen, dotRef?.current]);

  return (
    <>
      {isOpen && props.hasOverlay && <Overlay />}
      <div
        onClick={props.onClick ? props.onClick : noop}
        style={{ position: "relative" }}
      >
        {isOpen && props.showPulse && (
          <div
            ref={dotRef}
            style={{
              position: "absolute",
              height: 50,
              width: 50,
              ...props.pulseStyles,
            }}
          />
        )}
        <TooltipComponent
          boundary={"viewport"}
          content={
            <Text
              style={{
                whiteSpace: "pre",
                color: "#fff",
                display: "flex",
                textAlign: "center",
              }}
              type={TextType.P3}
            >
              {tourStepConfig?.data.message}
            </Text>
          }
          isOpen={!!isOpen}
          modifiers={props.modifiers}
          position={Position.BOTTOM}
        >
          {children}
        </TooltipComponent>
      </div>
    </>
  );
}

export default TourTooltipWrapper;
