import styled from "styled-components";
import { PropPaneDistributionHandleCustomEvent } from "../constants";
import React from "react";

const DistributionHandle = styled.div`
  display: flex;
  align-items: center;
  width: 10px;
  background-color: var(--ads-v2-color-bg-emphasis-plus);
  border: 3px solid var(--ads-v2-color-bg-emphasis);
  border-radius: 5px;
  cursor: col-resize;
  user-select: none;
  -webkit-user-select: none;
  &:hover,
  &.active {
    background: var(--ads-v2-color-bg-brand);
  }
`;

export const PropertyPaneSpaceDistributionHandle = ({
  distributionHandleId,
  propPaneHandleId,
}: {
  propPaneHandleId: string;
  distributionHandleId: string;
}) => {
  // Handler for the onMouseDown event
  const onMouseDown = (e: any) => {
    e.stopPropagation();
    e.preventDefault();

    // Dispatch a custom event to notify about the mouse down event on the handle
    const distributionHandle = document.getElementById(distributionHandleId);
    if (distributionHandle) {
      distributionHandle.dispatchEvent(
        new CustomEvent(PropPaneDistributionHandleCustomEvent, {
          detail: {
            mouseDownEvent: e,
          },
        }),
      );
    }
  };

  return (
    <DistributionHandle
      id={propPaneHandleId}
      key={propPaneHandleId}
      onMouseDown={onMouseDown}
    />
  );
};
