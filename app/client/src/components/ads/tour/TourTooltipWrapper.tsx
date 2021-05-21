import React from "react";
import TooltipComponent from "components/ads/Tooltip";
import { useSelector } from "react-redux";
import Text, { TextType } from "../Text";
import { Position } from "@blueprintjs/core";
import { getActiveTourIndex, getActiveTourType } from "selectors/tourSelectors";
import { TourType } from "entities/Tour";
import TourStepsByType from "constants/TourSteps";
import { AppState } from "reducers";
import { noop } from "lodash";

type Props = {
  children: React.ReactNode;
  tourType: TourType;
  tourIndex: number;
  onClick?: () => void;
};

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

  return (
    <div onClick={props.onClick ? props.onClick : noop}>
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
        position={Position.BOTTOM}
      >
        {children}
      </TooltipComponent>
    </div>
  );
}

export default TourTooltipWrapper;
