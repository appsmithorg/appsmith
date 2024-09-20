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
  zoneGap: number;
}
const StyledSpaceDistributionHandle = styled.div<{ left: number }>`
  display: inline;
  position: absolute;
  width: ${SpaceDistributorHandleDimensions.width}px;
  height: calc(100% - 2 * ${SpaceDistributorHandleDimensions.offsetTop}px);
  top: ${SpaceDistributorHandleDimensions.offsetTop}px;
  border-radius: ${SpaceDistributorHandleDimensions.borderRadius}px;
  padding: 0 ${SpaceDistributorHandleDimensions.padding}px;
  pointer-events: all;
  z-index: 1000;
  left: ${({ left }) => left}px;
  // Note: we are using translateX to center the handle instead of adjusting left property
  // (by subtracting half of the width of the handle) because translate is better with interpolating the sub-pixel values (pixel snapping issue)
  transform: translateX(-50%);
  &:hover {
    background: var(--space-distribution-handle-bg);
  }
  &.active {
    background: var(--space-distribution-handle-active-bg);
  }
  &:hover,
  &.active {
    cursor: col-resize;
  }
`;

const updateDistributionHandlePosition = (
  entries: ResizeObserverEntry[],
  ref: React.RefObject<HTMLDivElement>,
  zoneGap: number,
) => {
  if (ref.current && entries.length) {
    const target = entries[0].target as HTMLElement;

    if (target && target.parentElement) {
      // making this change to compute offset left coz offsetLeft of the dom api does not provide decimal values
      // which is causing the handle to jump on clicking it the first time

      // Get the left position of the parent element relative to the viewport
      const parentLeft = target.parentElement.getBoundingClientRect().left;

      // Get the left position of the target element relative to the viewport
      const targetLeft = target.getBoundingClientRect().left;

      // Calculate the offset between the left edges of the target element and its parent element
      const offsetLeft = targetLeft - parentLeft;

      // Calculate the midpoint between zones by subtracting half of the zoneGap from the offsetLeft
      const midPointBetweenZones = offsetLeft - zoneGap / 2;

      // Set the left position of the handle element using its reference
      ref.current.style.left = midPointBetweenZones + "px";
    }
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
  zoneGap,
  zoneIds,
}: SpaceDistributionNodeProps) => {
  // Create a ref for the distribution handle DOM element
  const ref = useRef<HTMLDivElement>(null);

  // Get the status of space distribution from Redux store
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);

  // Use a ref to keep track of whether the current handle is distributing space
  const isCurrentHandleDistributingSpace = useRef(false);

  // Calculate the left position of the distribution handle
  const leftPositionOfHandle = left - zoneGap * 0.5;

  // Destructure the parent zones array of zone ids
  const [leftZone, rightZone] = parentZones;

  // Create a ref for ResizeObserver for the right zone
  const resizeObserverRef = useRef<ResizeObserver>();

  resizeObserverRef.current = new ResizeObserver((entries) => {
    // Update the position of the distribution handle on resize
    requestAnimationFrame(() =>
      updateDistributionHandlePosition(entries, ref, zoneGap),
    );
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
      data-testid="t--anvil-distribution-handle"
      id={getDistributionHandleId(leftZone)}
      left={leftPositionOfHandle}
      ref={ref}
    />
  );
};
