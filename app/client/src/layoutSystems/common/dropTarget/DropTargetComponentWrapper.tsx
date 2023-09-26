import DropTargetComponent from "layoutSystems/common/dropTarget/DropTargetComponent";
import type { DropTargetComponentProps } from "layoutSystems/common/dropTarget/DropTargetComponent";
import type { ReactNode } from "react";
import React from "react";

type DropTargetComponentWrapperProps = {
  dropTargetProps: DropTargetComponentProps;
  dropDisabled: boolean;
  children: ReactNode;
  snapColumnSpace: number;
};

/**
 * This component is a wrapper for the DropTargetComponent.
 * It decides whether to render the DropTargetComponent or not based on the dropDisabled prop.
 */

export const DropTargetComponentWrapper = ({
  children,
  dropDisabled,
  dropTargetProps,
}: DropTargetComponentWrapperProps) => {
  if (dropDisabled) {
    //eslint-disable-next-line
    return <>{children}</>;
  }
  return (
    <DropTargetComponent {...dropTargetProps}>{children}</DropTargetComponent>
  );
};
