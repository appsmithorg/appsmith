import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { SpaceDistributorHandleDimensions } from "./constants";
import { getAnvilSpaceDistributionStatus } from "../integrations/selectors";
import { useSpaceDistributionEvents } from "./useSpaceDistributionEvents";

interface SpaceDistributionNodeProps {
  columnPosition: number;
  left: number;
  parentZones: string[];
  sectionLayoutId: string;
  spaceToWorkWith: number;
  spaceDistributed: { [key: string]: number };
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
  background: #f86a2b;
  opacity: 0%;
  z-index: 1000;
  left: ${({ left }) => left}px;
  &:hover,
  &.active {
    cursor: col-resize;
    opacity: 100%;
  }
`;

const updateHandlePosition = (
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
  spaceDistributed,
  spaceToWorkWith,
}: SpaceDistributionNodeProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isDistributingSpace = useSelector(getAnvilSpaceDistributionStatus);
  const isCurrentHandleDistributingSpace = useRef(false);
  const leftPositionOfHandle =
    left - SpaceDistributorHandleDimensions.width * 0.5;
  const [leftZone, rightZone] = parentZones;
  const resizeObserverRef = useRef<ResizeObserver>();
  resizeObserverRef.current = new ResizeObserver((entries) => {
    updateHandlePosition(entries, ref);
  });
  useSpaceDistributionEvents({
    ref,
    spaceDistributed,
    leftZone,
    rightZone,
    columnPosition,
    isCurrentHandleDistributingSpace,
    sectionLayoutId,
    spaceToWorkWith,
  });
  useEffect(() => {
    if (ref.current) {
      const rightZoneDom = document.getElementById(
        getAnvilWidgetDOMId(rightZone),
      );
      if (isDistributingSpace) {
        if (!isCurrentHandleDistributingSpace.current) {
          ref.current.style.display = "none";
        }
        rightZoneDom && resizeObserverRef.current?.observe(rightZoneDom);
      } else {
        ref.current.style.display = "block";
        rightZoneDom && resizeObserverRef.current?.unobserve(rightZoneDom);
      }
    }
  }, [isDistributingSpace]);

  return (
    <StyledSpaceDistributionHandle left={leftPositionOfHandle} ref={ref} />
  );
};
