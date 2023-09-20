import DropTargetComponent from "layoutSystems/common/dropTargetWrapper/DropTargetComponent";
import type { DropTargetComponentProps } from "layoutSystems/common/dropTargetWrapper/DropTargetComponent";
import type { ReactNode } from "react";
import React from "react";

type DropTargetComponentWrapperProps = {
  dropTargetProps: DropTargetComponentProps;
  dropDisabled: boolean;
  children: ReactNode;
  snapColumnSpace: number;
};
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
