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
  sectionId: string;
  layoutElementPositions: LayoutElementPositions;
  zoneCount: number;
}
const StyledSpaceDistributionHandle = styled.div<{ left: number }>`
  display: inline;
  position: absolute;
  width: ${SpaceDistributorHandleDimensions.width}px;
  height: ${SpaceDistributorHandleDimensions.height}%;
  border-radius: ${SpaceDistributorHandleDimensions.height * 0.5}px;
  border-color: white;
  border: ${SpaceDistributorHandleDimensions.border}px;
  background: #f86a2b;
  opacity: 0%;
  z-index: 1000;
  top: calc(50% - ${SpaceDistributorHandleDimensions.height * 0.5}%);
  left: ${({ left }) => left}px;
  &:hover,
  .active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

export const SpaceDistributionHandle = ({
  index,
  left,
  parentZones,
  sectionId,
  layoutElementPositions,
  zoneCount,
}: SpaceDistributionNodeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dispatch = useDispatch();
  const isDistributingSpace = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDistributingSpace,
  );
  const isCurrentHandleDistributingSpace = useRef(false);
  const leftPositionOfHandle =
    left -
    SpaceDistributorHandleDimensions.width * 0.5 -
    SpaceDistributorHandleDimensions.border;
  const [leftZone, rightZone] = parentZones;
  const leftZonePosition = layoutElementPositions[leftZone];
  const rightZonePosition = layoutElementPositions[rightZone];
  const sectionPositions = layoutElementPositions[sectionId];
  const columnWidth = sectionPositions.width / 12;
  const minWidthOfAZone = 2 * columnWidth;
  const minLeft = (index + 1) * minWidthOfAZone;
  const leftZoneColumns = leftZonePosition.width / columnWidth;
  const rightZoneColumns = rightZonePosition.width / columnWidth;
  const maxLeft =
    sectionPositions.width - (zoneCount - 1 - index) * minWidthOfAZone;
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
      const addMouseMoveHandlers = () => {
        if (ref.current) {
          ref.current.classList.add("active");
        }
        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
      };
      const removeMouseMoveHandlers = () => {
        if (ref.current) {
          ref.current.classList.remove("active");
        }
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
          });
          removeMouseMoveHandlers();
        }
      };
      const onMouseMove = (e: MouseEvent) => {
        if (ref.current && isCurrentHandleDistributingSpace.current) {
          const dx = e.clientX - x;
          const recomputeLeftStyle = leftPositionOfHandle + dx;
          if (minLeft <= recomputeLeftStyle && maxLeft >= recomputeLeftStyle) {
            const leftZoneDom = document.getElementById(
              getAnvilWidgetDOMId(leftZone),
            );
            const rightZoneDom = document.getElementById(
              getAnvilWidgetDOMId(rightZone),
            );
            ref.current.style.left = recomputeLeftStyle + "px";
            if (leftZoneDom && rightZoneDom) {
              leftZoneDom.style.flex = `1 1 ${
                ((leftZonePosition.width + dx) / sectionPositions.width) * 100
              }%`;
              rightZoneDom.style.flex = `1 1 ${
                ((rightZonePosition.width - dx) / sectionPositions.width) * 100
              }%`;
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
  }, []);
  return (
    <StyledSpaceDistributionHandle left={leftPositionOfHandle} ref={ref} />
  );
};
