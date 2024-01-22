import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { SpaceDistributorHandleDimensions } from "./constants";
import { getAnvilSpaceDistributionStatus } from "../integrations/selectors";
import { useSpaceDistributionEvents } from "./useSpaceDistributionEvents";
import { getDistributionHandleId } from "./utils/spaceDistributionEditorUtils";

interface SpaceDistributionNodeProps {
  columnPosition: number;
  left: number;
  parentZones: string[];
  sectionLayoutId: string;
  sectionWidgetId: string;
  spaceToWorkWith: number;
  spaceDistributed: { [key: string]: number };
  zoneIds: string[];
}
const StyledSpaceDistributionHandle = styled.div<{ left: number }>`
  display: inline;
  position: absolute;
  width: ${SpaceDistributorHandleDimensions.width}px;
  height: calc(100% - ${2 * SpaceDistributorHandleDimensions.offsetTop}px);
  top: ${SpaceDistributorHandleDimensions.offsetTop}px;
  border-radius: ${SpaceDistributorHandleDimensions.borderRadius}px;
  padding: 0px ${SpaceDistributorHandleDimensions.padding}px;
  border: ${SpaceDistributorHandleDimensions.border}px solid;
  border-color: white;
  background: var(--ads-v2-color-bg-brand);
  opacity: 0%;
  z-index: 1000;
  left: ${({ left }) => left}px;
  &:hover,
  &.active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

const updateDistributionHandlePosition = (
  entries: ResizeObserverEntry[],
  ref: React.RefObject<HTMLDivElement>,
) => {
  if (ref.current && entries.length) {
    const target = entries[0].target as HTMLElement;
    const updatedLeft =
      target.offsetLeft - SpaceDistributorHandleDimensions.width * 0.5;
    ref.current.style.left = updatedLeft + "px";
  }
};

export const SpaceDistributionHandle = ({
  columnPosition,
  left,
  parentZones,
  sectionLayoutId,
  sectionWidgetId,
  spaceDistributed,
  spaceToWorkWith,
  zoneIds,
}: SpaceDistributionNodeProps) => {
  // Create a ref for the distribution handle DOM element
  const ref = useRef<HTMLDivElement>(null);

  // Get the status of space distribution from Redux store
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);

  // Use a ref to keep track of whether the current handle is distributing space
  const isCurrentHandleDistributingSpace = useRef(false);

  // Calculate the left position of the distribution handle
  const leftPositionOfHandle =
    left - SpaceDistributorHandleDimensions.width * 0.5;

  // Destructure the parent zones array of zone ids
  const [leftZone, rightZone] = parentZones;

  // Create a ref for ResizeObserver for the right zone
  const resizeObserverRef = useRef<ResizeObserver>();
  resizeObserverRef.current = new ResizeObserver((entries) => {
    // Update the position of the distribution handle on resize
    updateDistributionHandlePosition(entries, ref);
  });

  // Use a custom hook to handle space distribution events
  useSpaceDistributionEvents({
    ref,
    spaceDistributed,
    leftZone,
    rightZone,
    columnPosition,
    isCurrentHandleDistributingSpace,
    sectionLayoutId,
    sectionWidgetId,
    spaceToWorkWith,
    zoneIds,
  });

  useEffect(() => {
    if (ref.current) {
      // Get the DOM element of the right zone
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );

      if (isDistributingSpace) {
        // If space is currently being distributed, hide the handle only if it is not the current handle distributing space.
        if (!isCurrentHandleDistributingSpace.current) {
          ref.current.style.display = "none";
        } else {
          // Observe the right zone for resizing during space distribution and update the position of the handle
          rightZoneDom && resizeObserverRef.current?.observe(rightZoneDom);
        }
      } else {
        // If space distribution is not active, show the handle
        ref.current.style.display = "block";
        // Stop observing the right zone for resizing
        rightZoneDom && resizeObserverRef.current?.unobserve(rightZoneDom);
      }
    }
  }, [isDistributingSpace]);

  return (
    <StyledSpaceDistributionHandle
      id={getDistributionHandleId(leftZone)}
      left={leftPositionOfHandle}
      ref={ref}
    />
  );
};
