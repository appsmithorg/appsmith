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
import { Indices } from "constants/Layers";

type Props = {
  children: React.ReactElement<any>;
  hasOverlay?: boolean;
  modifiers?: Modifiers;
  onClick?: () => void;
  pulseStyles?: CSSProperties;
  showPulse?: boolean;
  activeStepConfig: { [key in TourType]?: any };
};

const Overlay = styled.div`
  background-color: ${(props) => props.theme.colors.overlayColor};
  height: 100%;
  width: 100%;
  left: 0;
  top: 0;
  position: fixed;
  z-index: ${Indices.Layer1};
`;

const PulseDot = styled.div`
  position: absolute;
  height: 50px;
  width: 50px;
`;

const Container = styled.div`
  position: relative;
  z-index: ${Indices.Layer1};
`;

function TourTooltipWrapper(props: Props) {
  const { activeStepConfig, children } = props;

  const activeTourType = useSelector(getActiveTourType) as TourType;
  const expectedActiveStep = activeStepConfig[activeTourType];

  const isCurrentStepActive = useSelector(
    (state: AppState) => getActiveTourIndex(state) === expectedActiveStep,
  );

  const tourStepsConfig = TourStepsByType[activeTourType as TourType];
  const tourStepConfig = tourStepsConfig && tourStepsConfig[expectedActiveStep];
  const isOpen = isCurrentStepActive;
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anim = lottie.loadAnimation({
      animationData: pulsatingDot,
      autoplay: true,
      container: dotRef?.current as HTMLDivElement,
      renderer: "svg",
      loop: true,
    });

    return () => {
      anim?.destroy();
    };
  }, [isOpen, dotRef?.current]);

  if (!isOpen) return children;

  return (
    <>
      {/* A crude overlay which won't work with containers having overflow hidden */}
      {isOpen && props.hasOverlay && <Overlay />}
      <Container onClick={props.onClick ? props.onClick : noop}>
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
          {...tourStepConfig?.data.tooltipProps}
        >
          {children}
        </TooltipComponent>
        {isOpen && props.showPulse && (
          <PulseDot ref={dotRef} style={props.pulseStyles} />
        )}
      </Container>
    </>
  );
}

export default TourTooltipWrapper;
