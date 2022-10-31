import React from "react";
import { ReactNode } from "react";
import { DynamicHeight } from "utils/WidgetFeatures";
export type AutoHeightContainerProps = {
  children: ReactNode;
  autoHeight?: DynamicHeight;
  maxAutoHeight?: number;
  minAutoHeight?: number;
  onHeightUpdate?: (height: number) => void;
};
export default function AutoHeightContainer(props: AutoHeightContainerProps) {
  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{props.children}</>;
}
