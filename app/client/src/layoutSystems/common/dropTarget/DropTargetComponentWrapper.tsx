import DropTargetComponent from "layoutSystems/common/dropTarget/DropTargetComponent";
import type { DropTargetComponentProps } from "layoutSystems/common/dropTarget/DropTargetComponent";
import type { ReactNode } from "react";
import { memo } from "react";
import React from "react";
import { useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import type { AppState } from "ee/reducers";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";

interface DropTargetComponentWrapperProps {
  dropTargetProps: DropTargetComponentProps;
  dropDisabled: boolean;
  children: ReactNode;
  snapColumnSpace: number;
}

/**
 * This component is a wrapper for the DropTargetComponent.
 * It decides whether to render the DropTargetComponent or not based on the dropDisabled prop.
 */

export const DropTargetComponentWrapper = memo(
  ({
    children,
    dropDisabled,
    dropTargetProps,
  }: DropTargetComponentWrapperProps) => {
    // This code block is added exclusively to handle List Widget Meta Canvas Widget which is generated via template.
    const widget = useSelector((state: AppState) =>
      getWidget(state, dropTargetProps.parentId || MAIN_CONTAINER_WIDGET_ID),
    );

    if ((dropTargetProps.parentId && !widget) || dropDisabled) {
      //eslint-disable-next-line
      return <>{children}</>;
    }

    return (
      <DropTargetComponent {...dropTargetProps}>{children}</DropTargetComponent>
    );
  },
);
