import React from "react";
import { useSelector } from "react-redux";
import {
  getAppPositioningType,
  getRenderMode,
} from "selectors/editorSelectors";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";
import withWidgetProps from "../withWidgetProps";
import { useBaseWidgetRender } from "./useBaseWidgetRender";
export interface BaseWidgetProps extends WidgetProps, WidgetState {}

export const withBaseWidgetHOC = (Widget: (widgetData: any) => JSX.Element) => {
  function WrappedWidget(props: WidgetProps) {
    const renderMode = useSelector(getRenderMode);
    const appPositioningType = useSelector(getAppPositioningType);
    const appsmithWidgetRenderHoc = useBaseWidgetRender(
      renderMode,
      appPositioningType,
    );
    const BaseWidgetWrappedWidget = appsmithWidgetRenderHoc(Widget);
    const HydratedWidget = withWidgetProps(BaseWidgetWrappedWidget as any);
    return <HydratedWidget {...props} />;
  }
  return WrappedWidget;
};
