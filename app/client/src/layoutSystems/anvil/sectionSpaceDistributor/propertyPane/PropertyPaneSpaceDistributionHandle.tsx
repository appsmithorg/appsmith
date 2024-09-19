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
  &:hover {
    background: var(--space-distribution-handle-bg);
  }
  &.active {
    background: var(--space-distribution-handle-active-bg);
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
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
