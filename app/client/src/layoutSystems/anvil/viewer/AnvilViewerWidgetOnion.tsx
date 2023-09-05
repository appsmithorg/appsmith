import React from "react";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import { AnvilFlexComponent } from "../common/AnvilFlexComponent";
import { AnvilWidgetComponent } from "../common/widgetComponent/AnvilWidgetComponent";

export const AnvilViewerWidgetOnion = (props: BaseWidgetProps) => {
  return (
    <AnvilFlexComponent {...props}>
      <AnvilWidgetComponent {...props}>{props.childern}</AnvilWidgetComponent>
    </AnvilFlexComponent>
  );
};
