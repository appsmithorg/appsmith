import React from "react";
import BaseWidget, {
  SnipablePropertyValueType,
  WidgetProps,
  WidgetState,
} from "./BaseWidget";
import styled from "styled-components";

const SkeletonWrapper = styled.div`
  height: 100%;
  width: 100%;
`;

class SkeletonWidget extends BaseWidget<SkeletonWidgetProps, WidgetState> {
  static getPropertyPaneConfig() {
    return [];
  }
  getPageView() {
    return <SkeletonWrapper className="bp3-skeleton" />;
  }

  static getWidgetType() {
    return "SKELETON_WIDGET";
  }
}

export const CONFIG = {
  type: SkeletonWidget.getWidgetType(),
  name: "Skeleton",
  hideCard: true,
  defaults: {
    isLoading: true,
    rows: 4,
    columns: 4,
    widgetName: "Skeleton",
    version: 1,
  },
  properties: {
    derived: SkeletonWidget.getDerivedPropertiesMap(),
    default: SkeletonWidget.getDefaultPropertiesMap(),
    meta: SkeletonWidget.getMetaPropertiesMap(),
    config: SkeletonWidget.getPropertyPaneConfig(),
  },
  sniping: {
    widgetType: SkeletonWidget.getWidgetType(),
    isSnipable: false,
    snipableProperty: "",
    shouldSetPropertyInputToJsMode: false,
    snipablePropertyValueType: SnipablePropertyValueType.NONE,
  },
};

export interface SkeletonWidgetProps extends WidgetProps {
  isLoading: boolean;
}

export default SkeletonWidget;
