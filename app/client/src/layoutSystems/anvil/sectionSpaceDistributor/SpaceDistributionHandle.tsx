import type { AppState } from "@appsmith/reducers";
import type { LayoutElementPositions } from "layoutSystems/common/types";
import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { AnvilReduxActionTypes } from "../integrations/actions/actionTypes";
import { SpaceDistributorHandleDimensions } from "./constants";

interface SpaceDistributionNodeProps {
  index: number;
  left: number;
  parentZones: string[];
  sectionLayoutId: string;
  layoutElementPositions: LayoutElementPositions;
  spaceToWorkWith: number;
  spaceBetweenZones: number;
  spaceDistributed: { [key: string]: number };
}
const StyledSpaceDistributionHandle = styled.div<{ left: number }>`
  display: inline;
  position: absolute;
  width: ${SpaceDistributorHandleDimensions.width}px;
  height: ${SpaceDistributorHandleDimensions.height}%;
  border-radius: ${SpaceDistributorHandleDimensions.height * 0.5}px;
  padding: 0px ${SpaceDistributorHandleDimensions.padding}px;
  border: ${SpaceDistributorHandleDimensions.border}px solid;
  border-color: white;
  background: #f86a2b;
  opacity: 0%;
  z-index: 1000;
  top: calc(50% - ${SpaceDistributorHandleDimensions.height * 0.5}%);
  left: ${({ left }) => left}px;
  &:hover,
  &.active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

export const SpaceDistributionHandle = ({
  layoutElementPositions,
  left,
  parentZones,
  sectionLayoutId,
  spaceBetweenZones,
  spaceDistributed,
  spaceToWorkWith,
}: SpaceDistributionNodeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const isDistributingSpace = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDistributingSpace,
  );
  const isCurrentHandleDistributingSpace = useRef(false);
  const leftPositionOfHandle =
    left - SpaceDistributorHandleDimensions.width * 0.5;
  const [leftZone, rightZone] = parentZones;
  const leftZonePosition = layoutElementPositions[leftZone];
  const rightZonePosition = layoutElementPositions[rightZone];
  // const sectionPositions = layoutElementPositions[sectionLayoutId];
  const columnWidth = spaceToWorkWith / 12;
  const minWidthOfAZone = 2 * columnWidth;
  const minLeft = leftZonePosition.offsetLeft + minWidthOfAZone + 1;
  // const leftZoneColumns = leftZonePosition.width / columnWidth;
  // const rightZoneColumns = rightZonePosition.width / columnWidth;
  const maxLeft =
    rightZonePosition.offsetLeft +
    rightZonePosition.width -
    minWidthOfAZone +
    1;
  useEffect(() => {
    if (ref.current) {
      if (isDistributingSpace) {
        if (!isCurrentHandleDistributingSpace.current) {
          ref.current.style.display = "none";
        }
      } else {
        ref.current.style.display = "block";
      }
    }
  }, [isDistributingSpace]);
  useEffect(() => {
    if (ref.current) {
      // The current position of mouse
      let x = 0;
      let lastValidHandlePosition = 0;
      const currentFlexGrow = {
        leftZone: spaceDistributed[leftZone],
        rightZone: spaceDistributed[rightZone],
      };
      const currentGrowthFactor = {
        leftZone: currentFlexGrow.leftZone,
        rightZone: currentFlexGrow.rightZone,
      };
      const addMouseMoveHandlers = () => {
        if (ref.current) {
          ref.current.classList.add("active");
        }
        Object.entries(spaceDistributed).forEach(([zoneId, flexGrow]) => {
          const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
          if (zoneDom) {
            zoneDom.style.flexGrow = flexGrow.toString();
          }
        });
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
      };
      const removeMouseMoveHandlers = () => {
        if (ref.current) {
          ref.current.classList.remove("active");
          ref.current.style.left = "";
        }
        Object.keys(spaceDistributed).forEach((zoneId) => {
          const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
          if (zoneDom) {
            zoneDom.style.flexGrow = "";
            zoneDom.style.transition = "all 0.3s ease";
            setTimeout(() => {
              zoneDom.style.transition = "";
            }, 500);
          }
        });
        document.removeEventListener("mouseup", onMouseUp);
        document.removeEventListener("mousemove", onMouseMove);
      };
      const onMouseDown = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Get the current mouse position
        x = e.clientX;
        isCurrentHandleDistributingSpace.current = true;
        dispatch({
          type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_START,
        });
        addMouseMoveHandlers();
      };
      const onMouseUp = (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (isCurrentHandleDistributingSpace.current) {
          isCurrentHandleDistributingSpace.current = false;
          dispatch({
            type: AnvilReduxActionTypes.ANVIL_SPACE_DISTRIBUTION_STOP,
            payload: {
              zonesDistributed: {
                [leftZone]: currentGrowthFactor.leftZone,
                [rightZone]: currentGrowthFactor.rightZone,
              },
              sectionLayoutId,
            },
          });
          removeMouseMoveHandlers();
        }
      };
      const onMouseMove = (e: MouseEvent) => {
        if (ref.current && isCurrentHandleDistributingSpace.current) {
          const dx = e.clientX - x;
          const leftZoneDom = document.getElementById(
            getAnvilWidgetDOMId(leftZone),
          );
          const rightZoneDom = document.getElementById(
            getAnvilWidgetDOMId(rightZone),
          );
          const columnChange = dx / columnWidth;
          const leftZoneComputedColumns =
            currentFlexGrow.leftZone + columnChange;
          const rightZoneComputedColumns =
            currentFlexGrow.rightZone - columnChange;
          const leftZoneComputedColumnsRoundOff = Math.round(
            leftZoneComputedColumns,
          );
          const rightZoneComputedColumnsRoundOff = Math.round(
            rightZoneComputedColumns,
          );
          if (leftZoneDom && rightZoneDom) {
            if (leftZoneComputedColumns >= 2 && rightZoneComputedColumns >= 2) {
              leftZoneDom.style.flexGrow = Math.max(
                leftZoneComputedColumns,
                2,
              ).toString();
              rightZoneDom.style.flexGrow = Math.max(
                rightZoneComputedColumns,
              ).toString();
              const updatedLeft =
                rightZoneDom.offsetLeft -
                spaceBetweenZones * 0.5 -
                SpaceDistributorHandleDimensions.width * 0.5;
              lastValidHandlePosition = updatedLeft;
              ref.current.style.left = updatedLeft + "px";
              currentGrowthFactor.leftZone = leftZoneComputedColumnsRoundOff;
              currentGrowthFactor.rightZone = rightZoneComputedColumnsRoundOff;
            } else {
              if (leftZoneComputedColumns < 2) {
                leftZoneDom.style.flexGrow = "2";
                rightZoneDom.style.flexGrow = (
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  2
                ).toString();
                const updatedLeft =
                  rightZoneDom.offsetLeft -
                  spaceBetweenZones * 0.5 -
                  SpaceDistributorHandleDimensions.width * 0.5;
                lastValidHandlePosition = updatedLeft;
                ref.current.style.left = updatedLeft + "px";
                currentGrowthFactor.leftZone = 2;
                currentGrowthFactor.rightZone =
                  currentFlexGrow.rightZone + currentFlexGrow.leftZone - 2;
              } else if (rightZoneComputedColumns < 2) {
                rightZoneDom.style.flexGrow = "2";
                leftZoneDom.style.flexGrow = (
                  currentFlexGrow.rightZone +
                  currentFlexGrow.leftZone -
                  2
                ).toString();
                const updatedLeft =
                  rightZoneDom.offsetLeft -
                  spaceBetweenZones * 0.5 -
                  SpaceDistributorHandleDimensions.width * 0.5;
                lastValidHandlePosition = updatedLeft;
                ref.current.style.left = updatedLeft + "px";
                currentGrowthFactor.leftZone =
                  currentFlexGrow.rightZone + currentFlexGrow.leftZone - 2;
                currentGrowthFactor.rightZone = 2;
              }
              ref.current.style.left = lastValidHandlePosition + "px";
            }
          }
        }
      };
      ref.current.addEventListener("mousedown", onMouseDown);
      ref.current.addEventListener("mouseup", onMouseUp);

      return () => {
        if (ref.current) {
          ref.current.removeEventListener("mousedown", onMouseDown);
          ref.current.removeEventListener("mouseup", onMouseUp);
        }
      };
    }
  }, [leftPositionOfHandle, spaceDistributed, minLeft, maxLeft]);
  return (
    <StyledSpaceDistributionHandle left={leftPositionOfHandle} ref={ref} />
  );
};
